/** @jest-environment node */

const serverMocks = require('../__mocks__/serverMocks');

jest.mock('../../server/google', () => serverMocks.google);

const { isAuthenticated } = require('../../server/google');
const {
  res,
  throwError,
  SAMPLE_TEXT,
  SAMPLE_PLACEHOLDER,
  FILE,
} = require('../__mocks__/serverMocks');
const {
  NetworkError,
  areTextReplacementsValid,
  areTableReplacementsValid,
  getPlaceholdersFromTextValues,
  toNullIfNoPlaceholders,
  addPlaceholdersToTable,
  injectAuthValidation,
  injectCommonErrorHandling,
} = require('../../server/routeUtils');

describe('areTextReplacementsValid', () => {
  it('should return true for empty text replacements', () => {
    expect(areTextReplacementsValid({})).toBe(true);
  });

  it('should return true for text replacements which are strings', () => {
    expect(areTextReplacementsValid({ key: '' })).toBe(true);
  });

  it('should return false for malformed text replacements', () => {
    [
      null,
      undefined,
      [],
      { text: 123 },
    ].forEach((value) => {
      expect(areTextReplacementsValid(value)).toBe(false);
    });
  });
});

describe('areTableReplacementsValid', () => {
  it('should return true for an empty array', () => {
    expect(areTableReplacementsValid([])).toBe(true);
  });

  it('should return true if null items included', () => {
    expect(areTableReplacementsValid([null])).toBe(true);
  });

  it('should return true if item of expected shape included', () => {
    const TABLE_REPLACEMENT = {
      rows: [{
        metadata: {}, textReplacements: { text: '' },
      }],
    };
    expect(areTableReplacementsValid([TABLE_REPLACEMENT])).toBe(true);
  });

  it('should return false if item of unexpected shape included', () => {
    [
      '',
      {},
      { rows: null },
      { rows: {} },
      { rows: [] },
      { rows: '' },
      { rows: [{}] },
      { rows: [{ metadata: undefined, textReplacements: { text: 123 } }] },
    ].forEach((item) => {
      expect(areTableReplacementsValid([item])).toBe(false);
    });
  });
});

describe('getPlaceholdersFromTextValues', () => {
  it('should derive de-duped placeholders from text values', () => {
    const TEXT_VALUES = ['a {b}', 'c', '{d}', '{}', '{e', 'f}', '{b}'];
    const EXPECTED_PLACEHOLDERS = ['{b}', '{d}'];
    expect(getPlaceholdersFromTextValues(TEXT_VALUES)).toStrictEqual(EXPECTED_PLACEHOLDERS);
  });

  it('should return an empty array if no placeholders detected', () => {
    const TEXT_VALUES = ['abc'];
    expect(getPlaceholdersFromTextValues(TEXT_VALUES)).toStrictEqual([]);
  });
});

describe('toNullIfNoPlaceholders', () => {
  it('should return null if table has no placeholders', () => {
    const TABLE = { rows: [{ metadata: {}, placeholders: [] }] };
    expect(toNullIfNoPlaceholders(TABLE)).toBe(null);
  });

  it('should return table as-is if table has placeholders', () => {
    const TABLE = { rows: [{ metadata: {}, placeholders: [SAMPLE_PLACEHOLDER] }] };
    expect(toNullIfNoPlaceholders(TABLE)).toBe(TABLE);
  });
});

describe('addPlaceholdersToTable', () => {
  it('should return table with placeholders added except duplicates of file placeholders', () => {
    const NEW_PLACEHOLDER = '{xyz}';
    const TABLE_BEFORE = {
      rows: [{
        metadata: {},
        textValues: [SAMPLE_TEXT, SAMPLE_PLACEHOLDER, NEW_PLACEHOLDER],
      }],
    };
    const TABLE_AFTER = {
      rows: [{
        metadata: {},
        placeholders: [NEW_PLACEHOLDER],
      }],
    };
    expect(addPlaceholdersToTable(TABLE_BEFORE, FILE)).toStrictEqual(TABLE_AFTER);
  });
});

describe('injectAuthValidation', () => {
  it('should cause route handler to throw an error if user is not authenticated', () => {
    const handlers = { handler: jest.fn() };
    isAuthenticated.mockImplementationOnce(false);

    injectAuthValidation(handlers);
    handlers.handler({}, res);

    expect(isAuthenticated).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should pass control to original route handler function if user is authenticated', () => {
    const originalHandler = jest.fn();
    const handlers = { handler: originalHandler };

    injectAuthValidation(handlers);
    handlers.handler({}, res);

    expect(isAuthenticated).toHaveBeenCalledTimes(1);
    expect(originalHandler).toHaveBeenCalled();
  });
});

describe('injectCommonErrorHandling', () => {
  it('should wrap route handler functions with generic error handling', () => {
    const handlers = { handler: throwError };
    injectCommonErrorHandling(handlers);
    handlers.handler({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should wrap route handler functions with network error handling', () => {
    const handlers = { handler: jest.fn(() => { throw new NetworkError(418, '', new Error()); }) };
    injectCommonErrorHandling(handlers);
    handlers.handler({}, res);
    expect(res.status).toHaveBeenCalledWith(418);
  });
});
