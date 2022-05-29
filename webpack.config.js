const path = require('path');

const CloudflareWorkerPlugin = require('cloudflare-worker-webpack-plugin');
const { DefinePlugin } = require('webpack');

const {
  CLOUDFLARE_AUTH_EMAIL,
  CLOUDFLARE_AUTH_KEY,
  RPC_KEY,
  STORAGE_URL,
} = require('./config.json');


const log = console.log;
console.log = function () {
  console.dir([...arguments], {depth: null});
};

module.exports = {
  entry: [
    path.join(__dirname, 'lib', 'index.js'),
  ],
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
  },
  plugins: [
    new CloudflareWorkerPlugin(CLOUDFLARE_AUTH_EMAIL, CLOUDFLARE_AUTH_KEY, {
      site: 'notsobot.com',
      enabledPatterns: [
        '*notsobot.com',
        '*notsobot.com/*',
      ],
      disabledPatterns: [
        'notsobot.com/api/*',
      ],
      scriptName: 'notsobot-com',
      verbose: true,
    }),
    new DefinePlugin({
      __RPC_KEY__: `'${RPC_KEY}'`,
      __STORAGE_URL__: `'${STORAGE_URL}'`,
    }),
  ],
};
