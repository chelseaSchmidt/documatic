/** @jest-environment node */

['path'].forEach((module) => jest.mock(module));

const {
  saveCredentials,
  isAuthenticated,
} = require('../../server/google');

describe('google client', () => {
  it('should save credentials', () => {
    saveCredentials();
  });

  it('should provide authentication status', () => {
    const result = isAuthenticated();
    expect(typeof result).toBe('boolean');
  });
});
