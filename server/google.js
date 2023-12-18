/* eslint-plugin-disable @typescript-eslint */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const routes = require('../modules/routes');

const REDIRECT_URL = `http://localhost:3000${routes.AUTH_REDIRECT}`;

const {
  web: {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  },
} = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'credentials.json'), 'utf8'));

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL,
);

google.options({ auth: oauth2Client });

module.exports = {
  drive: google.drive('v3'),
  docs: google.docs('v1'),
  DOC_MIME_TYPE: 'application/vnd.google-apps.document',
  FOLDER_MIME_TYPE: 'application/vnd.google-apps.folder',
  AUTH_URL: oauth2Client.generateAuthUrl({
    scope: [
      // read/write permission to files explicitly shared with, or created by, this app
      'https://www.googleapis.com/auth/drive.file',
      // read permission to all files
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  }),
  saveCredentials: async (authCode) => {
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);
  },
  isAuthenticated: () => (
    Boolean((oauth2Client.credentials?.expiry_date || 0) > Date.now())
  ),
};
