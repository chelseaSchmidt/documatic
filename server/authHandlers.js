/* eslint-plugin-disable @typescript-eslint */
const {
  AUTH_URL,
  isAuthenticated,
  saveCredentials,
} = require('./google');
const { injectCommonErrorHandling } = require('./routeUtils');
const { HOME } = require('../modules/routes');

const handlers = {
  handleAuth: (req, res) => res.redirect(AUTH_URL),

  handleGetAuthStatus: (req, res) => res.status(200).send(isAuthenticated()),

  handleAuthRedirect: async (req, res) => {
    const code = req.query?.code;
    if (code) {
      try {
        await saveCredentials(code);
      } catch (error) {
        return res.status(401).send(error.message);
      }
      return res.redirect(HOME);
    }
    return res.status(400).send('Missing authorization code in URL');
  },
};

injectCommonErrorHandling(handlers);

module.exports = handlers;
