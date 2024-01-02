const forEach = require('lodash/forEach');
const {
  CreateParagraphBulletsRequest,
  InsertTableRowRequest,
  InsertTextRequest,
  UpdateParagraphStyleRequest,
  UpdateTableCellStyleRequest,
  UpdateTableRowStyleRequest,
  UpdateTextStyleRequest,
} = require('./docRequests');

const getTableRowElements = (row) => (
  row.tableCells?.flatMap((cell) => cell.content || {})
  || []
);

// TODO (communicate): new lines at end of cells will be ignored
const trimEndOfCellContent = (text) => {
  return text && text[text.length - 1] === '\n'
    ? text.slice(0, -1)
    : text;
};

module.exports = {
  getTableRows: (table) => (
    table?.tableRows?.map((row) => ({
      elements: getTableRowElements(row),
      metadata: row,
    }))
    || []
  ),

  getTableElements: (table) => (
    table?.tableRows?.flatMap(getTableRowElements)
    || []
  ),

  getRowUpdates: ({ row, index, tableStart }) => ([
    new InsertTableRowRequest(
      tableStart,
      index - 1,
    ),
    new UpdateTableRowStyleRequest(
      tableStart,
      [index],
      row.metadata.tableRowStyle,
    ),
  ]),

  getCellUpdates: ({
    cell,
    rowIndex,
    colIndex,
    tableStart,
  }) => (
    [
      new UpdateTableCellStyleRequest(
        tableStart,
        rowIndex,
        colIndex,
        cell.tableCellStyle,
      ),
    ]
  ),

  getParagraphUpdates: ({ paragraph, index }) => {
    const updates = [];

    if (paragraph.bullet) {
      // TODO (communicate): user must manually restore bullet indentation
      // and click continue numbering
      updates.push(
        new CreateParagraphBulletsRequest(
          index,
          'NUMBERED_DECIMAL_NESTED', // TODO: make this a dropdown menu on client
        ),
      );
    }

    updates.push(
      new UpdateParagraphStyleRequest(
        index,
        {
          ...paragraph.paragraphStyle,
          lineSpacing: 1_15, // TODO: make this a dropdown menu on client
        },
      ),
    );

    return updates;
  },

  getTextAndTextUpdates: ({
    element,
    index,
    cell,
    row,
  }) => {
    const result = {
      text: element.textRun?.content || '',
      updates: [],
    };

    if (element.endIndex === cell.endIndex) {
      result.text = trimEndOfCellContent(result.text);
    }

    if (result.text) {
      if (row.textReplacements) {
        forEach(row.textReplacements, (value, placeholder) => {
          result.text = result.text.replace(placeholder, value);
        });

        if (result.text) {
          result.updates = [
            new InsertTextRequest(result.text, index),
            new UpdateTextStyleRequest(
              index,
              index + result.text.length,
              element.textRun.textStyle,
            ),
          ];
        }
      }
    }

    return result;
  },
};
