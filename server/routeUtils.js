/* eslint-plugin-disable @typescript-eslint */
const { isAuthenticated } = require('./google');

const isString = (value) => typeof value === 'string';
const areAllKeysStrings = (object) => !Object.keys(object).map(isString).includes(false);
const areAllValuesStrings = (object) => !Object.values(object).map(isString).includes(false);

module.exports = {
  deDupe: (array) => Array.from(new Set(array)),

  respondWithErrorData: (res, data) => res.status(data.errorCode).send(data.errorMessage),

  areContentUpdatesValid: (contentUpdates) => {
    if (typeof contentUpdates === 'object') {
      if (!Array.isArray(contentUpdates)) {
        if (areAllKeysStrings(contentUpdates)) {
          return areAllValuesStrings(contentUpdates);
        }
      }
    }
    return false;
  },

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
