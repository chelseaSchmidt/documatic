/* eslint-disable global-require */
/** @jest-environment node */

const shallowMockedModules = [
  'morgan',
];

shallowMockedModules.forEach((module) => {
  jest.mock(module, () => (() => ({})));
});

jest.mock('express', () => {
  const express = () => ({
    use: () => {},
    listen: () => {},
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
