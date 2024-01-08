const { isAuthenticated } = require('./google');
const { PLACEHOLDER_PATTERN } = require('./constants');

class NetworkError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.statusCode = code;
  }
}

const ROW_PROPERTIES = ['metadata', 'textReplacements'];

const deDupe = (array) => Array.from(new Set(array));
const isString = (value) => typeof value === 'string';
const isObject = (value) => value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value);
const isNullableObject = (value) => isObject(value) || value === null || value === undefined;
const isRowCorrectShape = (object) => ROW_PROPERTIES.every((property) => property in object);
const toRows = (table) => table?.rows;
const toTextReplacements = (row) => row?.textReplacements;

const areTextReplacementsValid = (textReplacements) => (
  isObject(textReplacements)
  && Object.keys(textReplacements).every(isString)
  && Object.values(textReplacements).every(isString)
);

const getPlaceholdersFromTextValues = (textValues = []) => (
  deDupe(textValues.join('\n').match(PLACEHOLDER_PATTERN) || [])
);

module.exports = {
  NetworkError,

  areTextReplacementsValid,

  areTableReplacementsValid: (tableReplacements) => {
    const nonNullTables = tableReplacements.filter(Boolean);
    const flattenedRows = nonNullTables.flatMap(toRows);

    return (
      Array.isArray(tableReplacements)
      && (
        !tableReplacements.length
        || (
          tableReplacements.every(isNullableObject)
          && nonNullTables.map(toRows).every(Array.isArray)
          && nonNullTables.map(toRows).every((rows) => rows.length)
          && flattenedRows.every(isRowCorrectShape)
          && flattenedRows.map(toTextReplacements).every(areTextReplacementsValid)
          // TODO: schema validation on row.metadata
        )
      )
    );
  },

  getPlaceholdersFromTextValues,

  toNullIfNoPlaceholders: (table) => (
    table.rows.filter((row) => row.placeholders.length).length
      ? table
      : null
  ),

  addPlaceholdersToTable: (table, file) => ({
    rows: table.rows.map(
      ({ textValues, metadata }) => ({
        placeholders: (
          getPlaceholdersFromTextValues(textValues)
            .filter((placeholder) => !file.placeholders.includes(placeholder))
        ),
        metadata,
      }),
    ),
  }),

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
