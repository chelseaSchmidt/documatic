/* eslint-plugin-disable @typescript-eslint */
/* eslint-disable global-require */
/** @jest-environment node */

const SAMPLE_TEXT = 'abc';
const SAMPLE_PLACEHOLDER = '{abc}';
const PARAGRAPH_WITH_CONTENT = {
  paragraph: {
    elements: [
      { textRun: { content: SAMPLE_TEXT } }, // no placeholder should be detected
      { textRun: { content: SAMPLE_PLACEHOLDER } }, // placeholder should be detected
      { textRun: { content: SAMPLE_PLACEHOLDER } }, // placeholder should be de-duped
    ],
  },
};
const DETECTED_PLACEHOLDERS = [SAMPLE_PLACEHOLDER]; // expected placeholder end result
const DOC = {
  body: {
    content: [
      {},
      { tableOfContents: {} },
      { tableOfContents: { content: [] } },
      { tableOfContents: { content: [PARAGRAPH_WITH_CONTENT] } },
      { paragraph: {} },
      { paragraph: { elements: [] } },
      { paragraph: { elements: [{}] } },
      { paragraph: { elements: [{ textRun: {} }] } },
      PARAGRAPH_WITH_CONTENT,
      { table: {} },
      { table: { tableRows: [] } },
      { table: { tableRows: [{}] } },
      { table: { tableRows: [{ tableCells: [] }] } },
      { table: { tableRows: [{ tableCells: [{}] }] } },
      { table: { tableRows: [{ tableCells: [{ content: [] }] }] } },
      { table: { tableRows: [{ tableCells: [{ content: [PARAGRAPH_WITH_CONTENT] }] }] } },
    ],
  },
};
const EMPTY_DOC = { body: { content: [] } }; // TODO: test line 37 of fileHandlers with this
const FILE_METADATA = {};
const FILE = { metadata: FILE_METADATA, placeholders: DETECTED_PLACEHOLDERS };
const FILE_NO_PLACEHOLDERS = { metadata: FILE_METADATA, placeholders: [] };
const REQ = { params: { name: SAMPLE_TEXT } };

const throwError = jest.fn(() => { throw new Error(); });
const send = jest.fn();
const res = { status: jest.fn(() => ({ send })) };

const constructPostRequest = ({
  hasTemplateId = true,
  hasFileName = true,
  hasFolderName = true,
  hasContentUpdates = true,
} = {}) => {
  return {
    body: {
      templateId: hasTemplateId ? SAMPLE_TEXT : undefined,
      metadataUpdates: {
        fileName: hasFileName ? SAMPLE_TEXT : undefined,
        folderName: hasFolderName ? SAMPLE_TEXT : undefined,
      },
      contentUpdates: hasContentUpdates
        ? { [SAMPLE_PLACEHOLDER]: SAMPLE_TEXT }
        : {},
    },
  };
};

['path'].forEach((module) => jest.mock(module));

jest.mock('fs', () => ({
  readFileSync: () => '{ "web": { "client_id": "", "client_secret": "" } }',
}));

jest.mock('../../server/google', () => {
  return {
    isAuthenticated: jest.fn(() => true),
    drive: {
      files: {
        list: jest.fn(() => ({ data: { files: [{}] } })),
        get: jest.fn(() => ({ data: FILE_METADATA })),
        copy: jest.fn(() => ({ data: FILE_METADATA })),
      },
    },
    docs: {
      documents: {
        get: jest.fn(() => ({ data: DOC })),
        batchUpdate: jest.fn(() => ({ data: DOC })),
      },
    },
  };
});

const { cloneDeep } = require('lodash');
const {
  handleGetFileByName,
  handleCreateFile,
} = require('../../server/fileHandlers');
const {
  isAuthenticated,
  drive,
  docs,
} = require('../../server/google');

describe('GET file route handler', () => {
  it('should return the requested file with de-duped placeholders', async () => {
    await handleGetFileByName(REQ, res);
    expect(send).toHaveBeenCalledWith(FILE);
  });

  it('should return the requested file when no placeholders are detected', async () => {
    docs.documents.get.mockImplementationOnce(() => ({ data: EMPTY_DOC }));
    await handleGetFileByName(REQ, res);
    expect(send).toHaveBeenCalledWith(FILE_NO_PLACEHOLDERS);
  });

  it('should fail with status code 401 if user is not authenticated', async () => {
    isAuthenticated.mockImplementationOnce(() => false);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should fail with status code 400 if no file name is provided', async () => {
    const badReq = cloneDeep(REQ);
    badReq.params.name = '';
    await handleGetFileByName(badReq, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if the first external client query throws an error', async () => {
    drive.files.list.mockImplementationOnce(throwError);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 404 if no file is found', async () => {
    drive.files.list.mockImplementationOnce(() => ({ data: { files: [] } }));
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should fail with status code 400 if multiple files match the query', async () => {
    drive.files.list.mockImplementationOnce(() => ({ data: { files: [{}, {}] } }));
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 502 if the response from Google has an unexpected structure', async () => {
    drive.files.list.mockImplementationOnce(() => ({ data: {} }));
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it('should fail with status code 502 if there is an unexpected google.drive error not caused by bad inputs', async () => {
    drive.files.get.mockImplementationOnce(throwError);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it('should fail with status code 502 if there is an unexpected google.docs error not caused by bad inputs', async () => {
    docs.documents.get.mockImplementationOnce(throwError);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });
});

describe('POST file route handler', () => {
  it('should create a file and update its content', async () => {
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should create a file without updating its content', async () => {
    await handleCreateFile(constructPostRequest({ hasContentUpdates: false }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should fail with status code 400 if request is missing template ID', async () => {
    await handleCreateFile(
      constructPostRequest({ hasTemplateId: false, hasFileName: false, hasFolderName: false }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if request is missing file name', async () => {
    await handleCreateFile(constructPostRequest({ hasFileName: false }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if request is missing destination folder name', async () => {
    await handleCreateFile(constructPostRequest({ hasFolderName: false }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if the template file can\'t be copied due to invalid inputs', async () => {
    drive.files.copy.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should partially fail with status code 207 if file created but content not updated', async () => {
    docs.documents.batchUpdate.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(207);
  });

  it('should fail with status code 400 if specified destination folder invalid', async () => {
    drive.files.list.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 502 if file can\'t be retrieved after creation', async () => {
    drive.files.get
      .mockImplementationOnce(jest.fn(() => ({ data: FILE_METADATA })))
      .mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(502);
  });
});
