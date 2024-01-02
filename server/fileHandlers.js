const { PARAMS } = require('../modules/routes');
const { FILE_TYPES } = require('./constants');
const {
  DOC_MIME_TYPE,
  FOLDER_MIME_TYPE,
} = require('./google');
const {
  copyFile,
  getDocumentById,
  getFileMetadataById,
  getFileMetadataByName,
} = require('./googleUtils');
const {
  getPlaceholdersFromTextValues,
  toNullIfNoPlaceholders,
  addPlaceholdersToTable,
  areTextReplacementsValid,
  areTableReplacementsValid,
  injectAuthValidation,
  injectCommonErrorHandling,
} = require('./routeUtils');
const {
  getTables,
  getNonTableTextValues,
  replaceDocumentTextValues,
  replaceDocumentTables,
} = require('./docUtils');

const handlers = {
  handleGetFileByName: async (req, res) => {
    const file = {};

    file.metadata = await getFileMetadataByName(req.params[PARAMS.NAME]);

    if (file.metadata.mimeType !== DOC_MIME_TYPE) {
      return res.status(400).send('Template must be a Google Doc');
    }

    const document = await getDocumentById(file.metadata.id);

    file.placeholders = getPlaceholdersFromTextValues(getNonTableTextValues(document.body.content));

    file.tables = getTables(document.body.content)
      .map((table) => addPlaceholdersToTable(table, file))
      .map(toNullIfNoPlaceholders);

    return res.status(200).send(file);
  },

  handleCreateFile: async (req, res) => {
    if (
      !req.body?.templateId
      || !req.body.metadataUpdates?.fileName
      || !req.body.metadataUpdates?.folderName
    ) {
      return res.status(400).send('Malformed request body; missing template ID, file name, and/or destination folder name');
    }

    const {
      templateId,
      metadataUpdates: { fileName, folderName },
      textReplacements = {},
      tableReplacements = [],
    } = req.body;

    const file = {};

    if (!areTextReplacementsValid(textReplacements)) {
      return res.status(400).send('Invalid text replacement values specified; must provide key-value pairs of type "string"');
    }

    if (!areTableReplacementsValid(tableReplacements)) {
      return res.status(400).send('Table replacement data does not match expected schema');
    }

    const templateData = await getFileMetadataById(templateId);

    if (templateData.mimeType !== DOC_MIME_TYPE) {
      return res.status(400).send('Template must be a Google Doc');
    }

    const folderData = await getFileMetadataByName(folderName, FILE_TYPES.folder);

    if (folderData.mimeType !== FOLDER_MIME_TYPE) {
      return res.status(400).send('Save destination must be a folder');
    }

    file.metadata = await copyFile(templateId, fileName, folderData.id);

    try {
      file.metadata = await getFileMetadataById(file.metadata.id);
    } catch (error) {
      file.message = 'Copied template to a new document but unable to retrieve it';
      file.cause = error.cause?.stack || error.stack;
      return res.status(207).send(file);
    }

    try {
      await replaceDocumentTables(file.metadata.id, tableReplacements);

      await replaceDocumentTextValues(file.metadata.id, textReplacements);
    } catch (error) {
      file.message = 'Created a new document but not all content updates were successful';
      file.cause = error.cause?.stack || error.stack;
      return res.status(207).send(file);
    }

    return res.status(201).send(file);
  },
};

injectAuthValidation(handlers);
injectCommonErrorHandling(handlers);

module.exports = handlers;
