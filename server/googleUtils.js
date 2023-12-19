/* eslint-plugin-disable @typescript-eslint */

const { FILE_TYPES } = require('./constants');
const { drive, docs } = require('./google');
const { NetworkError } = require('./routeUtils');
const {
  isFileNameValid,
  INVALID_FILE_NAME_MESSAGE,
} = require('../modules/utils');

const toSentenceCase = (text) => text[0].toUpperCase() + text.slice(1).toLowerCase();

const getParagraphTextValues = (paragraph) => (
  paragraph?.elements?.map((element) => element.textRun?.content || '')
  || []
);

const getTableElements = (table) => (
  table?.tableRows?.flatMap((row) => row.tableCells?.flatMap((cell) => cell.content || {}) || [])
  || []
);

const getDocumentTextValues = (elements = []) => {
  let textSegments = [];
  elements.forEach((element) => {
    textSegments = textSegments
      .concat(getParagraphTextValues(element.paragraph))
      .concat(getDocumentTextValues(getTableElements(element.table)))
      .concat(getDocumentTextValues(element.tableOfContents?.content));
  });
  return textSegments;
};

module.exports = {
  getDocumentTextValues,

  getDocumentById: async (documentId) => {
    try {
      return (await docs.documents.get({ documentId })).data;
    } catch (error) {
      throw new NetworkError(500, 'Failed to get document by internal ID', error);
    }
  },

  getFileMetadataById: async (fileId) => {
    try {
      return (await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, webViewLink', // https://developers.google.com/drive/api/reference/rest/v3/files#File
      })).data;
    } catch (error) {
      throw new NetworkError(500, 'Failed to get file by internal ID', error);
    }
  },

  getFileMetadataByName: async (fileName, fileType = FILE_TYPES.file) => {
    if (!fileName) {
      throw new NetworkError(400, `Missing ${fileType} name in URL`);
    }

    if (!isFileNameValid(fileName)) {
      throw new NetworkError(400, INVALID_FILE_NAME_MESSAGE);
    }

    let matchingFiles = [];

    try {
      matchingFiles = (await drive.files.list({
        q: `name="${fileName}" AND trashed=false`,
        spaces: 'drive',
        corpora: 'user',
      })).data.files;
    } catch (error) {
      throw new NetworkError(500, 'Encountered unexpected error when searching for the file', error);
    }

    if (!matchingFiles.length) {
      throw new NetworkError(404, `${toSentenceCase(fileType)} not found`);
    }

    if (matchingFiles.length > 1) {
      throw new NetworkError(400, `Multiple ${fileType}s with name "${fileName}" found. Please make name unique.`);
    }

    return module.exports.getFileMetadataById(matchingFiles[0].id);
  },

  copyFile: async (fileId, newFileName, destinationFolderId) => {
    if (!isFileNameValid(newFileName)) {
      throw new NetworkError(400, INVALID_FILE_NAME_MESSAGE);
    }

    try {
      return (await drive.files.copy({
        fileId,
        requestBody: {
          name: newFileName,
          parents: [destinationFolderId],
        },
      }))?.data;
    } catch (error) {
      throw new NetworkError(500, 'Unable to copy the designated template', error);
    }
  },

  updateDocument: async (documentId, updates) => {
    try {
      // https://googleapis.dev/nodejs/googleapis/latest/docs/interfaces/Params$Resource$Documents$Batchupdate.html
      // if any request is not valid, the entire request will fail and nothing will be applied
      return (await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: updates },
      }))?.data;
    } catch (error) {
      throw new NetworkError(500, 'Unable to update document contents', error);
    }
  },
};
