/** @jest-environment node */

const serverMocks = require('../__mocks__/serverMocks');

jest.mock('path');
jest.mock('../../server/google', () => serverMocks.google);
jest.mock('../../server/googleUtils', () => serverMocks.googleUtils);
jest.mock('../../server/routeUtils', () => serverMocks.routeUtils);
jest.mock('../../server/docUtils', () => serverMocks.docUtils);

const {
  handleGetFileByName,
  handleCreateFile,
} = require('../../server/fileHandlers');
const {
  getFileMetadataById,
  getFileMetadataByName,
} = require('../../server/googleUtils');
const {
  areTextReplacementsValid,
  areTableReplacementsValid,
} = require('../../server/routeUtils');
const {
  replaceDocumentTables,
  replaceDocumentTextValues,
} = require('../../server/docUtils');
const {
  throwError,
  res,
  send,
  FILE_METADATA,
  FILE,
  FOLDER_NAME,
  FOLDER_METADATA,
  DOC_NAME,
  SAMPLE_TEXT,
  SAMPLE_PLACEHOLDER,
} = require('../__mocks__/serverMocks');

const REQ = { params: { name: DOC_NAME } };

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
        fileName: hasFileName ? DOC_NAME : undefined,
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
  it('should return the requested file', async () => {
    await handleGetFileByName(REQ, res);
    expect(send).toHaveBeenCalledWith(FILE);
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

  it('should fail with status code 400 if requested text replacements are invalid', async () => {
    areTextReplacementsValid.mockImplementationOnce(() => false);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if requested table replacements are invalid', async () => {
    areTableReplacementsValid.mockImplementationOnce(() => false);
    await handleCreateFile(constructPostRequest(), res);
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

  it('should partially fail with status code 207 if file created but tables could not be updated', async () => {
    replaceDocumentTables.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(207);
  });

  it('should partially fail with status code 207 if file created but document text could not be updated', async () => {
    replaceDocumentTextValues.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(207);
  });
});
