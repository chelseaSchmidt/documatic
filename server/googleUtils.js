/* eslint-plugin-disable @typescript-eslint */
const { FILE_TYPES } = require('./constants');
const { drive, docs } = require('./google');
const {
  isFileNameValid,
  INVALID_FILE_NAME_MESSAGE,
} = require('../modules/utils');

class ResponseData {
  data = null;
  errorCode = null;
  errorMessage = '';

  setData(data) {
    this.data = data;
  }

  setError({ code, message }) {
    this.errorCode = code;
    this.errorMessage = message;
  }
}

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
    const result = new ResponseData();

    try {
      result.setData((await docs.documents.get({ documentId })).data);
    } catch {
      result.setError({ code: 500, message: 'Failed to get document by internal ID' });
    }

    return result;
  },

  getFileMetadataById: async (fileId) => {
    const result = new ResponseData();

    try {
      result.setData(
        (await drive.files.get({
          fileId,
          fields: 'id, name, mimeType, webViewLink', // https://developers.google.com/drive/api/reference/rest/v3/files#File
        })).data,
      );
    } catch {
      result.setError({ code: 500, message: 'Failed to get file by internal ID' });
    }

    return result;
  },

  getFileMetadataByName: async (fileName, fileType = FILE_TYPES.file) => {
    const result = new ResponseData();

    if (!fileName) {
      result.setError({ code: 400, message: `Missing ${fileType} name in URL` });
      return result;
    }

    if (typeof fileName !== 'string') {
      result.setError({ code: 400, message: `Invalid ${fileType} name` });
      return result;
    }

    const matchingFiles = [];

    try {
      const files = (await drive.files.list({
        q: `name="${fileName}" AND trashed=false`,
        spaces: 'drive',
        corpora: 'user',
      }))?.data?.files;

      if (!Array.isArray(files)) {
        result.setError({ code: 502, message: 'Google sent an unexpected response format when searching for the file' });
        return result;
      }

      matchingFiles.push(...files);
    } catch (error) {
      result.setError({ code: 500, message: 'Encountered unexpected error when searching for the file' });
      return result;
    }

    if (!matchingFiles.length) {
      result.setError({ code: 404, message: `${toSentenceCase(fileType)} not found` });
      return result;
    }

    if (matchingFiles.length > 1) {
      result.setError({ code: 400, message: `Multiple ${fileType}s with name "${fileName}" found. Please make name unique.` });
      return result;
    }

    return module.exports.getFileMetadataById(matchingFiles[0].id);
  },

  copyFile: async (fileId, newFileName, destinationFolderId) => {
    const result = new ResponseData();

    if (!isFileNameValid(newFileName)) {
      result.setError({ code: 400, message: INVALID_FILE_NAME_MESSAGE });
      return result;
    }

    try {
      result.setData(
        (await drive.files.copy({
          fileId,
          requestBody: {
            name: newFileName,
            parents: [destinationFolderId],
          },
        }))?.data,
      );
    } catch {
      result.setError({ code: 500, message: 'Unable to copy the designated template' });
    }

    return result;
  },

  updateDocument: async (documentId, updates) => {
    const result = new ResponseData();

    try {
      // https://googleapis.dev/nodejs/googleapis/latest/docs/interfaces/Params$Resource$Documents$Batchupdate.html
      // if any request is not valid, the entire request will fail and nothing will be applied
      result.setData(
        (await docs.documents.batchUpdate({
          documentId,
          requestBody: { requests: updates },
        }))?.data,
      );
    } catch {
      result.setError({ code: 500, message: 'Unable to update document contents' });
    }

    return result;
  },
};
