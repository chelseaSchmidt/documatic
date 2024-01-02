/* eslint-disable no-await-in-loop, object-curly-newline */

const map = require('lodash/map');
const { NetworkError } = require('./routeUtils');
const {
  getDocumentById,
  updateDocument,
} = require('./googleUtils');
const {
  DeleteTableRowRequest,
  ReplaceAllTextRequest,
} = require('./docRequests');
const {
  getTableRows,
  getTableElements,
  getRowUpdates,
  getCellUpdates,
  getParagraphUpdates,
  getTextAndTextUpdates,
} = require('./tableUtils');

const getParagraphTextValues = (paragraph) => (
  paragraph?.elements?.map((element) => element.textRun?.content || '')
  || []
);

const getDocumentTextValues = (elements = []) => {
  let textValues = [];
  elements.forEach((element) => {
    textValues = textValues
      .concat(getParagraphTextValues(element.paragraph))
      .concat(getDocumentTextValues(getTableElements(element.table)))
      .concat(getDocumentTextValues(element.tableOfContents?.content));
  });
  return textValues;
};

const getNonTableTextValues = (elements = []) => {
  let textValues = [];
  elements.forEach((element) => {
    textValues = textValues
      .concat(getParagraphTextValues(element.paragraph))
      .concat(getNonTableTextValues(element.tableOfContents?.content));
  });
  return textValues;
};

const getTables = (elements = []) => (
  elements
    .filter((element) => Boolean(element.table))
    .map((element) => ({
      rows: getTableRows(element.table).map((row) => ({
        textValues: getDocumentTextValues(row.elements),
        metadata: row.metadata,
      })),
      metadata: element,
    }))
);

const getTablesFromDocumentById = async (documentId) => (
  getTables((await getDocumentById(documentId)).body.content)
);

module.exports = {
  getTables,

  getNonTableTextValues,

  replaceDocumentTextValues: async (documentId, replacements = {}) => {
    if (Object.keys(replacements).length) {
      await updateDocument(
        documentId,
        map(
          replacements,
          (value, placeholder) => new ReplaceAllTextRequest(value, placeholder),
        ),
      );
    }
  },

  replaceDocumentTables: async (documentId, tableReplacements = []) => {
    const CELL_BOUNDARY = 2;
    const ROW_BOUNDARY = 1;
    const tableCount = (await getTablesFromDocumentById(documentId)).length;

    if (tableReplacements.length !== tableCount) {
      throw new NetworkError(400, 'Table updates requested do not match number of tables in document');
    }

    for (let i = 0; i < tableReplacements.length; i += 1) {
      // table positions change after each set of updates, so refresh tables each loop
      const {
        startIndex: tableStart,
        endIndex: tableEnd,
        table: { rows: startingRowCount },
      } = (await getTablesFromDocumentById(documentId))[i].metadata;

      const textStart = tableEnd + 1;
      const updates = [];
      let offset = 0;

      if (tableReplacements[i]) {
        tableReplacements[i].rows.forEach((row, j) => {
          const rowIndex = startingRowCount + j;

          updates.push(...getRowUpdates({ row, index: rowIndex, tableStart }));

          row.metadata.tableCells.forEach((cell, colIndex) => {
            updates.push(...getCellUpdates({ cell, rowIndex, colIndex, tableStart }));

            cell.content.forEach(({ paragraph }) => {
              if (paragraph) {
                updates.push(...getParagraphUpdates({ paragraph, index: textStart + offset }));

                paragraph.elements.forEach((element) => {
                  const {
                    text,
                    updates: textUpdates,
                  } = getTextAndTextUpdates({ element, index: textStart + offset, cell, row });

                  updates.push(...textUpdates);
                  offset += text.length;
                });
              }
            });
            offset += CELL_BOUNDARY;
          });
          offset += ROW_BOUNDARY;
        });

        for (let j = 0; j < startingRowCount; j += 1) {
          updates.push(new DeleteTableRowRequest(tableStart, 0));
        }

        if (updates.length) {
          await updateDocument(documentId, updates);
        }
      }
    }
  },
};
