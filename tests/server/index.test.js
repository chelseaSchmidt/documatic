/* eslint-disable global-require */
/** @jest-environment node */

['morgan', 'path'].forEach((module) => jest.mock(module));

jest.mock('express', () => {
  const express = () => ({
    get: () => {},
    listen: () => {},
    use: () => {},
  });
  express.static = () => {};
  return express;
});

describe('server', () => {
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
