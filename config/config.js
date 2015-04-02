var nconf = require('nconf')
  , fs = require('fs')
  ;

//
// Include this file anywhere you need to access the app's config variables
//
// Access a variable like:
//
//  GLOBAL.SocketIO.Config.get('Facebook:app_id');
//
// nconf is cooler than you imagine.  see: https://github.com/indexzero/nconf
//
// Set a default env
process.env.NODE_ENV = (process.env.NODE_ENV || "development");

// Set up a namespace
GLOBAL.SocketIO = { Config:nconf };

var configFName = process.cwd() + '/config/' + process.env.NODE_ENV + '.json';

if (!fs.existsSync(configFName)) {
  throw new Error('Missing config file: ' + configFName + '  Consider running /scripts/generate-config-file.js');
}

console.log('(info) using config file: ' + configFName);

//
// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'
//
GLOBAL.SocketIO.Config
  .argv()
  .env()
  .file({ file: configFName })
;

//
// Set all defaults here - use these if not found in any source above
//
nconf.defaults({
  "REDISCLOUD_URL": "localhost:6379"
});