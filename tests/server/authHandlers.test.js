/* eslint-disable global-require */
/** @jest-environment node */

const REQ = { query: { code: 'abc' } };

const throwError = jest.fn(() => { throw new Error(); });
const send = jest.fn();
const res = { status: jest.fn(() => ({ send })), redirect: jest.fn() };

['path'].forEach((module) => jest.mock(module));

jest.mock('../../server/google', () => {
  return {
    saveCredentials: jest.fn(),
    isAuthenticated: jest.fn(() => true),
  };
});

const { HOME } = require('../../modules/routes');
const {
  handleAuth,
  handleAuthRedirect,
  handleGetAuthStatus,
} = require('../../server/authHandlers');
const {
  saveCredentials,
  isAuthenticated,
} = require('../../server/google');

describe('authentication route handler', () => {
  it('should redirect user to external authentication page', async () => {
    await handleAuth(REQ, res);
    expect(res.redirect).toHaveBeenCalled();
  });

  it('should fail with status code 500 if there is an unexpected error', async () => {
    res.redirect.mockImplementationOnce(throwError);
    await handleAuth(REQ, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('authentication-redirect route handler', () => {
  it('should save the auth token from the URL', async () => {
    await handleAuthRedirect(REQ, res);
    expect(saveCredentials).toHaveBeenCalledWith(REQ.query.code);
  });

  it('should fail with status code 400 when no auth token is present in the URL', async () => {
    await handleAuthRedirect({}, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 401 if auth token cannot be saved on the external client', async () => {
    saveCredentials.mockImplementationOnce(throwError);
    await handleAuthRedirect(REQ, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should redirect user to home page after external authentication complete', async () => {
    await handleAuthRedirect(REQ, res);
    expect(res.redirect).toHaveBeenCalledWith(HOME);
  });

  it('should fail with status code 500 if there is an unexpected error', async () => {
    res.redirect.mockImplementationOnce(throwError);
    await handleAuthRedirect(REQ, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('GET authentication status route handler', () => {
  it('should return true when user is authenticated', async () => {
    await handleGetAuthStatus(REQ, res);
    expect(send).toHaveBeenCalledWith(true);
  });

  it('should return false when user is not authenticated', async () => {
    isAuthenticated.mockImplementationOnce(() => false);
    await handleGetAuthStatus(REQ, res);
    expect(send).toHaveBeenCalledWith(false);
  });

  it('should fail with status code 500 if there is an unexpected error', async () => {
    isAuthenticated.mockImplementationOnce(throwError);
    await handleGetAuthStatus(REQ, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
