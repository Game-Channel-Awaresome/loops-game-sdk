const webpack = require('webpack');
const config = require('./webpack.base.config');
const path = require('path');

config.entry = './main.js';
config.output = {
  path: path.resolve('dist'),
  filename: 'build.js',
  library: 'loops-game-sdk',
  libraryTarget: 'umd',
};

config.plugins = (config.plugins || []).concat([
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  }),
  new webpack.optimize.UglifyJsPlugin({
    sourceMap: false,
    compress: {
      warnings: false,
    },
    comments: false,
  }),
]);
module.exports = config;
