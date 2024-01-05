const { google } = require('googleapis');
const { PORT } = require('./constants');
const routes = require('../modules/routes');

const isProd = process.env.MODE === 'prod';
const redirectUrl = isProd
  ? `https://chelseadocumatic.com${routes.AUTH_REDIRECT}`
  : `http://localhost:${PORT}${routes.AUTH_REDIRECT}`;

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing required environment variables GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET');
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  redirectUrl,
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
