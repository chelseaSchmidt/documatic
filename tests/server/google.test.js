/* eslint-disable global-require */
/** @jest-environment node */

process.env.GOOGLE_CLIENT_ID = 'google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

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
