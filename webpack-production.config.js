var path = require('path');
var webpack = require('webpack');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var TransferWebpackPlugin = require('transfer-webpack-plugin');

var config = {
  entry: [
    path.join(__dirname, '/src/app/app.jsx')
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(JSON.parse(process.env.DEV || 'true')),
      __RELEASE__: JSON.stringify(JSON.parse(process.env.RELEASE || 'false'))
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.NoErrorsPlugin(),
    new TransferWebpackPlugin([
      { from: 'src/www' },
    ]),
  ],
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: [nodeModulesPath]
      },
      {
        test: /\.css$/,
        loaders: ['style', 'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]', 'postcss']
      }
    ]
  }
};

module.exports = config;