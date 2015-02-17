var nconf = require('nconf')
  ;

//
// Include this file anywhere you need to access the app's config variables
//

// Set a default env
process.env.NODE_ENV = (process.env.NODE_ENV || "development");

// Set up a namespace
GLOBAL.SocketIO = { Config:nconf };

var configFName = process.cwd() + '/config/' + process.env.NODE_ENV + '.json';
console.log('(info) using config file: ' + configFName);
GLOBAL.SocketIO.Config.argv()
  .env()
  .file({ file: configFName })
;

