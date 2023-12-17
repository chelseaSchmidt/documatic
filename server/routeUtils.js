/* eslint-plugin-disable @typescript-eslint */
const { isAuthenticated } = require('./google');

module.exports = {
  deDupe: (array) => Array.from(new Set(array)),

  respondWithErrorData: (res, data) => res.status(data.errorCode).send(data.errorMessage),

  injectAuthValidation: (handlers) => {
    Object.entries(handlers).forEach(([key, handler]) => {
      // eslint-disable-next-line no-param-reassign
      handlers[key] = async (req, res) => {
        if (!isAuthenticated()) {
          res.status(401).send('Not authenticated');
        } else {
          await handler(req, res);
        }
      };
    });
  },

  injectCommonErrorHandling: (handlers) => {
    Object.entries(handlers).forEach(([key, handler]) => {
      // eslint-disable-next-line no-param-reassign
      handlers[key] = async (req, res) => {
        try {
          await handler(req, res);
        } catch (error) {
          res.status(500).send(`Internal error: ${error.message}`);
        }
      };
    });
  },
};
