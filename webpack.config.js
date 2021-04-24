var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  // Fixes "Error: Can't resolve 'buffer'" in js-yaml
  // Can be removed after upgrading to js-yaml >= 4.1
  // See https://github.com/nodeca/js-yaml/commit/c15d424448108771708eb942515b06020ecfe84c
  resolve: {
    fallback: {
      buffer: false
    }
  },
  devtool: 'source-map'
};
