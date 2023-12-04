/* eslint-plugin-disable @typescript-eslint */
const {
  AUTH_URL,
  drive,
  isAuthenticated,
  saveCredentials,
} = require('./google');
const {
  HOME,
  PARAMS,
} = require('../modules/routes');

const handlers = {
  handleAuth: (req, res) => res.redirect(AUTH_URL),
  handleGetAuthStatus: (req, res) => res.status(200).send(isAuthenticated()),
  handleAuthRedirect: async (req, res) => {
    const code = req.query?.code;
    if (code) {
      try {
        await saveCredentials(code);
      } catch (error) {
        return res.status(401).send(error.message);
      }
      return res.redirect(HOME);
    }
    return res.status(400).send('Missing authorization code in URL');
  },
  handleGetFile: async (req, res) => {
    const fileName = req.params[PARAMS.NAME];

    if (!isAuthenticated()) {
      return res.status(401).send('Not authenticated');
    }
    if (!fileName) {
      return res.status(400).send('Missing file name in URL');
    }

    let fileRes;

    try {
      fileRes = await drive.files.list({
        q: `name="${fileName}" AND trashed=false`,
        spaces: 'drive',
        corpora: 'user',
      });
    } catch (error) {
      return res.status(400).send('Invalid file name');
    }

    if (!fileRes.data?.files?.length) {
      return res.status(404).send('File not found');
    }

    const { files } = fileRes.data;

    if (files.length > 1) {
      return res.status(400).send(`Multiple files with name "${fileName}" found. Please make name unique.`);
    }

    const { data: file } = await drive.files.get({
      fileId: files[0].id,
      fields: 'id, name, webViewLink', // https://developers.google.com/drive/api/reference/rest/v3/files#File
    });

    return res.status(200).send(file);
  },
};

Object.entries(handlers).forEach(([key, handler]) => {
  handlers[key] = async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(500).send(`Internal error: ${error.message}`);
    }
  };
});

module.exports = handlers;
