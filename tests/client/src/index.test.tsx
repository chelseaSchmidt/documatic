/* eslint-disable global-require */
import '@testing-library/jest-dom';

describe('client', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should run', () => {
    document.body.innerHTML = '<div id="app"></div>';
    require('../../../client/src');
  });

  it('should not crash if root element is missing', () => {
    document.body.innerHTML = '<div></div>';
    require('../../../client/src');
  });
});
