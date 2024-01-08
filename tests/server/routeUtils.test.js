/** @jest-environment node */

const serverMocks = require('../__mocks__/serverMocks');

jest.mock('../../server/google', () => serverMocks.google);

const { isAuthenticated } = require('../../server/google');
const {
  res,
  throwError,
} = require('../__mocks__/serverMocks');
const {
  NetworkError,
  areTextReplacementsValid,
  getPlaceholdersFromTextValues,
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

describe('getPlaceholdersFromTextValues', () => {
  it('should derive de-duped placeholders from text values', () => {
    const TEXT_VALUES = ['a {b}', 'c', '{d}', '{}', '{e', 'f}', '{b}'];
    const EXPECTED_PLACEHOLDERS = ['{b}', '{d}'];
    expect(getPlaceholdersFromTextValues(TEXT_VALUES)).toStrictEqual(EXPECTED_PLACEHOLDERS);
  });
});

describe('injectAuthValidation', () => {
  it('should wrap route handler functions with authentication validation', () => {
    const handlers = { handler: jest.fn() };
    isAuthenticated.mockImplementationOnce(false);

    handlers.handler({}, res);
    injectAuthValidation(handlers);
    handlers.handler({}, res);

    expect(isAuthenticated).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
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
    const handlers = { handler: jest.fn(() => { throw new NetworkError(418); }) };
    injectCommonErrorHandling(handlers);
    handlers.handler({}, res);
    expect(res.status).toHaveBeenCalledWith(418);
  });
});
