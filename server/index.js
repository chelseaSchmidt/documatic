/* eslint-plugin-disable @typescript-eslint */
const express = require('express');
const morgan = require('morgan');
const path = require('path');

const server = express();
const port = process.env.PORT || 3000;
const isProd = process.env.MODE === 'prod';
const publicDir = path.resolve(__dirname, '..', 'client', 'public');

console.log({ port, isProd, publicDir });

server.use(morgan(isProd ? 'tiny' : 'dev'));
server.use(express.static(publicDir));
server.listen(port, () => console.log(`Listening at http://localhost:${port}`));
