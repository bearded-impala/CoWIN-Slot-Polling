const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const APP_DIR = path.resolve(__dirname, 'src');

const config = {
  entry: `${APP_DIR}/index.js`,
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'docs'),
    filename: '[name].js',
    publicPath: '/CoWIN-Slot-Polling/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.html$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'html-loader',
          },
        ],
      },
      {
        test: /\.(css|less)$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          }
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: `${APP_DIR}/index.html`,
      title: 'CoWIN Polling',
    }),
    new CopyPlugin({
      patterns: [
        { from: "./src/service-worker.js" },
      ],
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'src'),
    publicPath: '/CoWIN-Slot-Polling/',
    openPage: 'CoWIN-Slot-Polling/',
    port: 8080,
    open: true,
    hot: true
  },
};
module.exports = config;
