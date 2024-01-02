const { isAuthenticated } = require('./google');

class NetworkError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.statusCode = code;
  }
}

const isString = (value) => typeof value === 'string';
const isObject = (value) => typeof value === 'object' && !Array.isArray(value);
const areAllKeysStrings = (object) => !Object.keys(object).map(isString).includes(false);
const areAllValuesStrings = (object) => !Object.values(object).map(isString).includes(false);

module.exports = {
  NetworkError,

  deDupe: (array) => Array.from(new Set(array)),

  areContentUpdatesValid: (contentUpdates) => (
    isObject(contentUpdates)
    && areAllKeysStrings(contentUpdates)
    && areAllValuesStrings(contentUpdates)
  ),

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
          if (error instanceof NetworkError) {
            res.status(error.statusCode).send({
              message: error.message,
              cause: error.cause?.stack,
            });
          } else {
            res.status(500).send({
              message: error.message,
              cause: error.stack,
            });
          }
        }
      };
    });
  },
};
