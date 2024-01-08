/* eslint-disable global-require */
/** @jest-environment node */

const serverMocks = require('../__mocks__/serverMocks');

jest.mock('path');
jest.mock('../../server/google', () => serverMocks.google);
jest.mock('../../server/googleUtils', () => serverMocks.googleUtils);

const {
  handleGetFileByName,
  handleCreateFile,
} = require('../../server/fileHandlers');
const {
  isAuthenticated,
} = require('../../server/google');
const {
  getDocumentById,
  getFileMetadataById,
  getFileMetadataByName,
  updateDocument,
} = require('../../server/googleUtils');
const {
  throwError,
  FILE_METADATA,
  FILE,
  FOLDER_NAME,
  FOLDER_METADATA,
  SAMPLE_TEXT,
  SAMPLE_PLACEHOLDER,
} = require('../__mocks__/serverMocks');

const DOC_FILE_NAME = 'doc-file-name';
const REQ = { params: { name: DOC_FILE_NAME } };

const send = jest.fn();
const res = { status: jest.fn(() => ({ send })) };

const constructPostRequest = ({
  hasTemplateId = true,
  hasFileName = true,
  hasFolderName = true,
  hasTextReplacements = true,
} = {}) => {
  return {
    body: {
      templateId: hasTemplateId ? FILE_METADATA.id : undefined,
      metadataUpdates: {
        fileName: hasFileName ? DOC_FILE_NAME : undefined,
        folderName: hasFolderName ? FOLDER_NAME : undefined,
      },
      textReplacements: hasTextReplacements
        ? { [SAMPLE_PLACEHOLDER]: SAMPLE_TEXT }
        : {},
      tableReplacements: Array(7).fill(null),
    },
  };
};

describe('GET file route handler', () => {
  it('should return the requested file with de-duped placeholders', async () => {
    await handleGetFileByName(REQ, res);
    expect(send).toHaveBeenCalledWith(FILE);
  });

  it('should return the requested file when no placeholders are detected', async () => {
    const EMPTY_DOC = { body: { content: [] } };
    const FILE_NO_PLACEHOLDERS = {
      metadata: FILE_METADATA,
      placeholders: [],
      tables: [],
    };
    getDocumentById.mockImplementationOnce(() => EMPTY_DOC);

    await handleGetFileByName(REQ, res);

    expect(send).toHaveBeenCalledWith(FILE_NO_PLACEHOLDERS);
  });

  it('should fail with status code 401 if user is not authenticated', async () => {
    isAuthenticated.mockImplementationOnce(() => false);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should fail with status code 400 if searched file is not a google doc', async () => {
    getFileMetadataByName.mockImplementationOnce(() => FOLDER_METADATA);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('POST file route handler', () => {
  it('should create a file and update its content', async () => {
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should create a file without updating its content', async () => {
    await handleCreateFile(constructPostRequest({ hasTextReplacements: false }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should fail with status code 400 if request is missing template ID', async () => {
    await handleCreateFile(
      constructPostRequest({ hasTemplateId: false, hasFileName: false, hasFolderName: false }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if request is missing destination folder name', async () => {
    await handleCreateFile(constructPostRequest({ hasFolderName: false }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if requested text replacements aren\'t strings', async () => {
    const req = constructPostRequest();
    req.body.textReplacements = { number: 123 };
    await handleCreateFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if requested text replacements are malformed', async () => {
    const req = constructPostRequest();
    req.body.textReplacements = [];
    await handleCreateFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if requested template is not a google doc', async () => {
    getFileMetadataById.mockImplementationOnce(() => FOLDER_METADATA);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if specified save destination is not a folder', async () => {
    getFileMetadataByName.mockImplementationOnce(() => FILE_METADATA);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should partially fail with status code 207 if file can\'t be retrieved after creation', async () => {
    getFileMetadataById
      .mockImplementationOnce(() => FILE_METADATA)
      .mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(207);
  });

  it('should partially fail with status code 207 if file created but content not updated', async () => {
    updateDocument.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(207);
  });

  it('should fail with status code 400 if table replacement data is malformed', async () => {
    const req = constructPostRequest();
    req.body.tableReplacements = [{}];
    await handleCreateFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
