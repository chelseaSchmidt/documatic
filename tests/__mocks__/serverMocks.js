/** @jest-environment node */

const DOC_MIME_TYPE = 'doc-mime-type';
const DOC_FILE_ID = 'doc-file-id';
const DOC_NAME = 'doc-name';
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
const TABLES = [
  { table: {} },
  { table: { tableRows: [] } },
  { table: { tableRows: [{}] } },
  { table: { tableRows: [{ tableCells: [] }] } },
  { table: { tableRows: [{ tableCells: [{}] }] } },
  { table: { tableRows: [{ tableCells: [{ content: [] }] }] } },
  { table: { tableRows: [{ tableCells: [{ content: [PARAGRAPH_WITH_CONTENT] }] }] } },
];
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
      ...TABLES,
    ],
  },
};
const FILE_METADATA = { id: DOC_FILE_ID, mimeType: DOC_MIME_TYPE };
const FOLDER_METADATA = { id: FOLDER_ID, mimeType: FOLDER_MIME_TYPE };

const send = jest.fn();

class NetworkError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.statusCode = code;
  }
}

module.exports = {
  DOC,
  DOC_NAME,
  FOLDER_NAME,
  FOLDER_METADATA,
  SAMPLE_TEXT,
  SAMPLE_PLACEHOLDER,
  FILE_METADATA,
  FILE: {
    metadata: FILE_METADATA,
    placeholders: DETECTED_PLACEHOLDERS,
    tables: Array(TABLES.length).fill(null),
  },

  send,
  res: { status: jest.fn(() => ({ send })) },
  throwError: jest.fn(() => { throw new Error(); }),
  throwNetworkError: jest.fn(() => { throw new NetworkError(418, '', new Error()); }),

  google: {
    DOC_MIME_TYPE,
    FOLDER_MIME_TYPE,
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
  },

  googleUtils: {
    getFileMetadataById: jest.fn((id) => (
      id === FOLDER_ID
        ? FOLDER_METADATA
        : FILE_METADATA
    )),
    getFileMetadataByName: jest.fn((name) => (
      name === FOLDER_NAME
        ? FOLDER_METADATA
        : FILE_METADATA
    )),
    getDocumentById: jest.fn(() => DOC),
    copyFile: jest.fn(() => FILE_METADATA),
    updateDocument: jest.fn(() => DOC),
  },

  routeUtils: {
    areTextReplacementsValid: jest.fn(() => true),
    areTableReplacementsValid: jest.fn(() => true),
    getPlaceholdersFromTextValues: jest.fn(() => DETECTED_PLACEHOLDERS),
    toNullIfNoPlaceholders: jest.fn(() => null),
    addPlaceholdersToTable: jest.fn(() => ({})),
    injectAuthValidation: jest.fn(),
    injectCommonErrorHandling: jest.fn(),
    NetworkError,
  },

  docUtils: {
    getTables: jest.fn(() => Array(TABLES.length).fill(null)),
    getNonTableTextValues: jest.fn(() => []),
    replaceDocumentTextValues: jest.fn(() => {}),
    replaceDocumentTables: jest.fn(() => {}),
  },
};
