/* eslint-disable global-require */
/** @jest-environment node */

const DOC_MIME_TYPE = 'doc-mime-type';
const DOC_FILE_ID = 'doc-file-id';
const DOC_FILE_NAME = 'doc-file-name';
const FOLDER_MIME_TYPE = 'folder-mime-type';
const FOLDER_ID = 'folder-id';
const FOLDER_NAME = 'folder-name';
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
const EMPTY_DOC = { body: { content: [] } };
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
const FILE_METADATA = { id: DOC_FILE_ID, mimeType: DOC_MIME_TYPE };
const FILE = { metadata: FILE_METADATA, placeholders: DETECTED_PLACEHOLDERS };
const FILE_NO_PLACEHOLDERS = { metadata: FILE_METADATA, placeholders: [] };
const FOLDER_METADATA = { id: FOLDER_ID, mimeType: FOLDER_MIME_TYPE };
const REQ = { params: { name: DOC_FILE_NAME } };

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
      templateId: hasTemplateId ? DOC_FILE_ID : undefined,
      metadataUpdates: {
        fileName: hasFileName ? DOC_FILE_NAME : undefined,
        folderName: hasFolderName ? FOLDER_NAME : undefined,
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
        list: jest.fn(({ q }) => {
          if (q.includes(FOLDER_NAME)) return { data: { files: [FOLDER_METADATA] } };
          return { data: { files: [FILE_METADATA] } };
        }),
        get: jest.fn(({ fileId }) => {
          if (fileId === FOLDER_ID) return { data: FOLDER_METADATA };
          return { data: FILE_METADATA };
        }),
        copy: jest.fn(() => ({ data: FILE_METADATA })),
      },
    },
    docs: {
      documents: {
        get: jest.fn(() => ({ data: DOC })),
        batchUpdate: jest.fn(() => ({ data: DOC })),
      },
    },
    DOC_MIME_TYPE,
    FOLDER_MIME_TYPE,
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

  it('should fail with status code 400 if file name is not valid', async () => {
    const badReq = cloneDeep(REQ);
    badReq.params.name = 123;
    await handleGetFileByName(badReq, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 500 if file list search throws an error', async () => {
    drive.files.list.mockImplementationOnce(throwError);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(500);
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

  it('should fail with status code 400 if searched file is not a google doc', async () => {
    drive.files.get.mockImplementationOnce(() => ({ data: FOLDER_METADATA }));
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 500 if file can\'t be retrieved by its internal ID', async () => {
    drive.files.get.mockImplementationOnce(throwError);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should fail with status code 500 if document can\'t be retrieved by its internal ID', async () => {
    docs.documents.get.mockImplementationOnce(throwError);
    await handleGetFileByName(REQ, res);
    expect(res.status).toHaveBeenCalledWith(500);
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

  it('should fail with status code 400 if requested content updates aren\'t strings', async () => {
    const req = constructPostRequest();
    req.body.contentUpdates = { number: 123 };
    await handleCreateFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if requested content updates are malformed', async () => {
    const req = constructPostRequest();
    req.body.contentUpdates = [];
    await handleCreateFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if requested template is not a google doc', async () => {
    drive.files.get.mockImplementationOnce(() => ({ data: FOLDER_METADATA }));
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if specified save destination is not a folder', async () => {
    drive.files.get
      .mockImplementationOnce(() => ({ data: FILE_METADATA }))
      .mockImplementationOnce(() => ({ data: FILE_METADATA }));
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if requested new file name is not a valid string', async () => {
    const req = constructPostRequest();
    req.body.metadataUpdates.fileName = '/';
    await handleCreateFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if requested new file name is not a string', async () => {
    const req = constructPostRequest();
    req.body.metadataUpdates.fileName = 123;
    await handleCreateFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 500 if unexpected error retrieving template by its internal ID', async () => {
    drive.files.get.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should fail with status code 500 if unexpected error retrieving destination folder', async () => {
    drive.files.get
      .mockImplementationOnce(() => ({ data: FILE_METADATA }))
      .mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should partially fail with status code 207 if file can\'t be retrieved after creation', async () => {
    drive.files.get
      .mockImplementationOnce(() => ({ data: FILE_METADATA }))
      .mockImplementationOnce(() => ({ data: FOLDER_METADATA }))
      .mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(207);
  });

  it('should fail with status code 500 if the template file can\'t be copied after validating inputs', async () => {
    drive.files.copy.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should partially fail with status code 207 if file created but content not updated', async () => {
    docs.documents.batchUpdate.mockImplementationOnce(throwError);
    await handleCreateFile(constructPostRequest(), res);
    expect(res.status).toHaveBeenCalledWith(207);
  });
});
