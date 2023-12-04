/* eslint-plugin-disable @typescript-eslint */
/* eslint-disable global-require */
/** @jest-environment node */
const FILE = {};
const REQ = { query: { code: 'abc' }, params: { name: 'abc' } };

const throwError = jest.fn(() => { throw new Error(); });
const send = jest.fn();
const res = { status: jest.fn(() => ({ send })), redirect: jest.fn() };

['path'].forEach((module) => jest.mock(module));

jest.mock('fs', () => ({
  readFileSync: () => '{ "web": { "client_id": "", "client_secret": "" } }',
}));

jest.mock('../../server/google', () => {
  return {
    saveCredentials: jest.fn(),
    isAuthenticated: jest.fn(() => true),
    drive: {
      files: {
        list: jest.fn(() => ({ data: { files: [{}] } })),
        get: jest.fn(() => ({ data: FILE })),
      },
    },
  };
});

const { cloneDeep } = require('lodash');
const { HOME } = require('../../modules/routes');
const {
  handleAuth,
  handleAuthRedirect,
  handleGetAuthStatus,
  handleGetFile,
} = require('../../server/routeHandlers');
const {
  saveCredentials,
  isAuthenticated,
  drive,
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

describe('GET file route handler', () => {
  it('should return the requested file', async () => {
    await handleGetFile(REQ, res);
    expect(send).toHaveBeenCalledWith(FILE);
  });

  it('should fail with status code 401 if user is not authenticated', async () => {
    isAuthenticated.mockImplementationOnce(() => false);
    await handleGetFile(REQ, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should fail with status code 400 if no file name is provided', async () => {
    const badReq = cloneDeep(REQ);
    badReq.params.name = '';
    await handleGetFile(badReq, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 400 if the first external client query throws an error', async () => {
    drive.files.list.mockImplementationOnce(throwError);
    await handleGetFile(REQ, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 404 if no file is found', async () => {
    drive.files.list.mockImplementationOnce(() => ({ data: { files: [] } }));
    await handleGetFile(REQ, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should fail with status code 400 if multiple files match the query', async () => {
    drive.files.list.mockImplementationOnce(() => ({ data: { files: [{}, {}] } }));
    await handleGetFile(REQ, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail with status code 500 if there is an unexpected error', async () => {
    drive.files.get.mockImplementationOnce(throwError);
    await handleGetFile(REQ, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
