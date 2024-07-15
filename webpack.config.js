const path = require('path');

module.exports = {
  entry: './static/scripts/script.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};