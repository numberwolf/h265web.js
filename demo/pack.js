// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './dist/play.js',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  output: {
    filename: 'dist/bundle.js',
  },
};
