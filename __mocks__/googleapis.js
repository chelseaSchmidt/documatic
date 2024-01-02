/* eslint-disable class-methods-use-this, lines-between-class-members */

module.exports = {
  google: {
    auth: {
      OAuth2: class OAuth2 {
        constructor() {
          this.credentials = {};
        }
        generateAuthUrl() {}
        getToken() {
          return { tokens: {} };
        }
        setCredentials() {}
      },
    },
    options: () => {},
    drive: () => {},
    docs: () => {},
  },
};
