/* eslint-disable global-require */
/** @jest-environment node */

jest.mock('path');

describe('google client', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
  });

  it('should fail to run if required secrets aren\'t present', () => {
    process.env.GOOGLE_CLIENT_ID = '';
    process.env.GOOGLE_CLIENT_SECRET = '';
    expect(() => require('../../server/google')).toThrow();
  });

  it('should save credentials', () => {
    const { saveCredentials } = require('../../server/google');
    saveCredentials();
  });

  it('should provide authentication status', () => {
    const { isAuthenticated } = require('../../server/google');
    const result = isAuthenticated();
    expect(typeof result).toBe('boolean');
  });
});
