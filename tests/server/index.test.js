/* eslint-disable global-require */
/** @jest-environment node */

['morgan', 'path'].forEach((module) => jest.mock(module));

jest.mock('express', () => {
  const express = () => ({
    get: () => {},
    listen: () => {},
    post: () => {},
    use: () => {},
  });
  express.static = () => {};
  express.json = () => {};
  return express;
});

describe('server', () => {
  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
  });

  beforeEach(() => {
    jest.resetModules();
    process.env.MODE = undefined;
  });

  it('should run in dev mode', () => {
    require('../../server');
  });

  it('should run in prod mode', () => {
    process.env.MODE = 'prod';
    require('../../server');
  });
});
