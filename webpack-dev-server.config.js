var path = require('path');
var webpack = require('webpack');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');

var config = {
  entry: [
    'webpack/hot/only-dev-server',
    path.join(__dirname, '/src/app/app.jsx')
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  devServer:{
    contentBase: './src/www',
    devtool: 'eval',
    hot: true,
    inline: true,
    port: 3000
  },
  devtool: 'eval',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(JSON.parse(process.env.DEV || 'true')),
      __RELEASE__: JSON.stringify(JSON.parse(process.env.RELEASE || 'false'))
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loaders: ['react-hot','babel'],
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