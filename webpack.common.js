/* eslint-plugin-disable @typescript-eslint */
const path = require('path');

module.exports = {
  entry: './client/src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'client', 'public'),
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'client/src/'),
      components: path.resolve(__dirname, 'client/src/components/'),
      styles: path.resolve(__dirname, 'client/src/styles/'),
    },
    extensions: ['.js', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        exclude: /(node_modules)/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
