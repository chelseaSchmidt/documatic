/* eslint-plugin-disable @typescript-eslint */
const map = require('lodash/map');
const { PARAMS } = require('../modules/routes');
const {
  FILE_TYPES,
  PLACEHOLDER_PATTERN,
} = require('./constants');
const {
  copyFile,
  getDocumentById,
  getDocumentTextValues,
  getFileMetadataById,
  getFileMetadataByName,
  updateDocument,
} = require('./googleUtils');
const {
  deDupe,
  injectAuthValidation,
  injectCommonErrorHandling,
  respondWithErrorData,
} = require('./routeUtils');

const handlers = {
  handleGetFileByName: async (req, res) => {
    const fileResult = await getFileMetadataByName(req.params[PARAMS.NAME]);
    if (fileResult.errorCode) return respondWithErrorData(res, fileResult);

    const docResult = await getDocumentById(fileResult.data.id);
    if (docResult.errorCode) return respondWithErrorData(res, docResult);

    const file = {
      metadata: fileResult.data,
      placeholders: deDupe(
        getDocumentTextValues(docResult.data.body.content)
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

    const folderResult = await getFileMetadataByName(folderName, FILE_TYPES.folder);
    if (folderResult.errorCode) return respondWithErrorData(res, folderResult);

    const copiedFileResult = await copyFile(templateId, fileName, folderResult.data.id);
    if (copiedFileResult.errorCode) return respondWithErrorData(res, copiedFileResult);
    file.metadata = copiedFileResult.data; // TODO: include file in error responses after this point

    const fileResult = await getFileMetadataById(file.metadata.id);
    if (fileResult.errorCode) return respondWithErrorData(res, fileResult);
    file.metadata = fileResult.data;

    if (Object.keys(contentUpdates).length) {
      const updatedResult = await updateDocument(
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

      if (updatedResult.errorCode) {
        return res.status(207).send({
          message: 'Copied template to a new document but unable to update document contents',
          file,
        });
      }
    }

    return res.status(201).send(file);
  },
};

injectAuthValidation(handlers);
injectCommonErrorHandling(handlers);

module.exports = handlers;
