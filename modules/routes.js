/* eslint-plugin-disable @typescript-eslint */

module.exports = {
  HOME: '/',
  AUTH: '/auth',
  AUTH_STATUS: '/auth-status',
  AUTH_REDIRECT: '/oauth2callback',
  FILE: '/file',
  PARAMS: { NAME: 'name' },
  toParam: (param) => `/:${param}`,
};
