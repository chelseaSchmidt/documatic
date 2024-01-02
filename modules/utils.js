/* eslint-disable no-useless-escape */

module.exports = {
  isFileNameValid: (fileName) => {
    if (typeof fileName === 'string') {
      return /^[ \w-\[\]`^*{}~!@#$%&()+=|?><.,';:]+$/.test(fileName);
    }
    return false;
  },
  INVALID_FILE_NAME_MESSAGE: (
    'Invalid name. Please only use alphanumeric characters, underscore, space, '
    + 'or these special characters: - [ ] ` ^ * { } ~ ! @ # $ % & ( ) + = | ? > < . , \' ; :'
  ),
};
