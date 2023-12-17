/* eslint-disable class-methods-use-this */
/* eslint-plugin-disable @typescript-eslint */

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
