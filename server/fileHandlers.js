/* eslint-plugin-disable @typescript-eslint */
const map = require('lodash/map');
const { PARAMS } = require('../modules/routes');
const {
  FILE_TYPES,
  PLACEHOLDER_PATTERN,
} = require('./constants');
const {
  DOC_MIME_TYPE,
  FOLDER_MIME_TYPE,
} = require('./google');
const {
  copyFile,
  getDocumentById,
  getDocumentTextValues,
  getFileMetadataById,
  getFileMetadataByName,
  updateDocument,
} = require('./googleUtils');
const {
  areContentUpdatesValid,
  deDupe,
  injectAuthValidation,
  injectCommonErrorHandling,
} = require('./routeUtils');

const handlers = {
  handleGetFileByName: async (req, res) => {
    const fileData = await getFileMetadataByName(req.params[PARAMS.NAME]);

    if (fileData.mimeType !== DOC_MIME_TYPE) {
      return res.status(400).send('Template must be a Google Doc');
    }

    const docData = await getDocumentById(fileData.id);

    const file = {
      metadata: fileData,
      placeholders: deDupe(
        getDocumentTextValues(docData.body.content)
          .join(' ')
          .match(PLACEHOLDER_PATTERN)
        || [],
      ),
    };

    return res.status(200).send(file);
  },

  handleCreateFile: async (req, res) => {
    if (
      !req.body?.templateId
      || !req.body.metadataUpdates?.fileName
      || !req.body.metadataUpdates?.folderName
    ) {
      return res.status(400).send(
        'Malformed request body; missing template ID, file name, and/or destination folder name. '
        + 'Example request body: '
        + '{ templateId: "...", metadataUpdates: { fileName: "...", folderName: "..." } }',
      );
    }

    const {
      templateId,
      metadataUpdates: { fileName, folderName },
      contentUpdates = {},
    } = req.body;

    const file = {};

    if (!areContentUpdatesValid(contentUpdates)) {
      return res.status(400).send('Invalid find-and-replace values specified; must provide key-value pairs of type "string"');
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

      if (Object.keys(contentUpdates).length) {
        await updateDocument(
          file.metadata.id,
          map(contentUpdates, (value, placeholder) => ({
            replaceAllText: {
              replaceText: value,
              containsText: {
                text: placeholder,
                matchCase: true,
              },
            },
          })),
        );
      }
    } catch (error) {
      return res.status(207).send({
        message: 'Copied template to a new document but unable to update document contents',
        cause: error.stack,
        data: file,
      });
    }

    return res.status(201).send(file);
  },
};

injectAuthValidation(handlers);
injectCommonErrorHandling(handlers);

module.exports = handlers;
