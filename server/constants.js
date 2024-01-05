const PORT = process.env.PORT || 3000;

module.exports = {
  PORT,
  PLACEHOLDER_PATTERN: /{.+?}/g,
  FILE_TYPES: {
    file: 'file',
    folder: 'folder',
  },
};
