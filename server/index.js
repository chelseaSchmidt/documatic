/* eslint-plugin-disable @typescript-eslint */
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { PORT, HOME_URL } = require('./constants');
const routes = require('../modules/routes');
const { PARAMS, toParam } = require('../modules/routes');
const {
  handleGetFileByName,
  handleCreateFile,
} = require('./fileHandlers');
const {
  handleAuth,
  handleAuthRedirect,
  handleGetAuthStatus,
} = require('./authHandlers');

const isProd = process.env.MODE === 'prod';
const startupMessage = `Listening at ${HOME_URL} in ${isProd ? 'production' : 'development'} mode`;

const server = express();

server.use(morgan(isProd ? 'tiny' : 'dev'));
server.use(express.static(path.resolve(__dirname, '..', 'client', 'public')));
server.use(express.json());

server.get(routes.AUTH, handleAuth);
server.get(routes.AUTH_REDIRECT, handleAuthRedirect);
server.get(routes.AUTH_STATUS, handleGetAuthStatus);
server.get(`${routes.FILE}${toParam(PARAMS.NAME)}`, handleGetFileByName);
server.post(routes.FILE, handleCreateFile);

server.listen(PORT, () => console.log(startupMessage));
