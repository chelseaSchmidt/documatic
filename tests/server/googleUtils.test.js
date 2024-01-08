/* eslint-disable global-require, import/order */
/** @jest-environment node */

jest.mock('path');
jest.mock('../../server/google', () => require('../__mocks__/serverMocks').google);

const { NetworkError } = require('../../server/routeUtils');
const {
  getDocumentById,
  getFileMetadataById,
  getFileMetadataByName,
  copyFile,
  updateDocument,
} = require('../../server/googleUtils');
const {
  drive,
  docs,
} = require('../../server/google');
const {
  DOC,
  FILE_METADATA,
  FOLDER_METADATA,
  throwError,
} = require('../__mocks__/serverMocks');

const FILE_NAME = 'file-name';

describe('getDocumentById', () => {
  it('should return a document', async () => {
    const result = await getDocumentById(FILE_METADATA.id);
    expect(result).toBe(DOC);
  });

  it('should rethrow unexpected errors as network errors with status code 500', async () => {
    docs.documents.get.mockImplementationOnce(throwError);
    let error;

    try {
      await getDocumentById(FILE_METADATA.id);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(500);
  });
});

describe('getFileMetadataById', () => {
  it('should return a file\'s metadata', async () => {
    const result = await getFileMetadataById(FILE_METADATA.id);
    expect(result).toBe(FILE_METADATA);
  });

  it('should rethrow unexpected errors as network errors with status code 500', async () => {
    drive.files.get.mockImplementationOnce(throwError);
    let error;

    try {
      await getFileMetadataById(FILE_METADATA.id);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(500);
  });
});

describe('getFileMetadataByName', () => {
  it('should return a file\'s metadata', async () => {
    const result = await getFileMetadataByName(FILE_NAME);
    expect(result).toBe(FILE_METADATA);
  });

  it('should throw a network error with status code 400 if file name is missing', async () => {
    let error;

    try {
      await getFileMetadataByName();
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(400);
  });

  it('should throw a network error with status code 400 if file name is invalid', async () => {
    let error;

    try {
      await getFileMetadataByName(123);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(400);
  });

  it('should throw a network error with status code 404 if no file found', async () => {
    drive.files.list.mockImplementationOnce(() => ({ data: { files: [] } }));
    let error;

    try {
      await getFileMetadataByName(FILE_NAME);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(404);
  });

  it('should throw a network error with status code 400 if multiple matches found', async () => {
    drive.files.list.mockImplementationOnce(() => ({ data: { files: [{}, {}] } }));
    let error;

    try {
      await getFileMetadataByName(FILE_NAME);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(400);
  });

  it('should rethrow unexpected errors as network errors with status code 500', async () => {
    drive.files.list.mockImplementationOnce(throwError);
    let error;

    try {
      await getFileMetadataByName(FILE_NAME);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(500);
  });
});

describe('copyFile', () => {
  it('should return a file copy', async () => {
    const result = await copyFile(FILE_METADATA.id, FILE_NAME, FOLDER_METADATA.id);
    expect(result).toBe(FILE_METADATA);
  });

  it('should throw a network error with status code 400 if new file name is invalid', async () => {
    let error;

    try {
      await copyFile(FILE_METADATA.id, 123, FOLDER_METADATA.id);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(400);
  });

  it('should rethrow unexpected errors as network errors with status code 500', async () => {
    drive.files.copy.mockImplementationOnce(throwError);
    let error;

    try {
      await copyFile(FILE_METADATA.id, FILE_NAME, FOLDER_METADATA.id);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(500);
  });
});

describe('updateDocument', () => {
  it('return an updated document', async () => {
    const result = await updateDocument();
    expect(result).toBe(DOC);
  });

  it('should rethrow unexpected errors as network errors with status code 500', async () => {
    docs.documents.batchUpdate.mockImplementationOnce(throwError);
    let error;

    try {
      await updateDocument();
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.statusCode).toBe(500);
  });
});
