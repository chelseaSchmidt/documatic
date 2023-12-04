/* eslint-plugin-disable @typescript-eslint */
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { PORT, HOME_URL } = require('./constants');

const isProd = process.env.MODE === 'prod';
const startupMessage = `Listening at ${HOME_URL} in ${isProd ? 'production' : 'development'} mode`;

const server = express();

server.use(morgan(isProd ? 'tiny' : 'dev'));
server.use(express.static(path.resolve(__dirname, '..', 'client', 'public')));

server.listen(PORT, () => console.log(startupMessage));
