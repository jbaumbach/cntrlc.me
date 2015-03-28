var 
  fs = require('fs')
  , nconf = require('nconf')
  , util = require('util')
  ;

var configFName = process.cwd() + '/config/' + process.env.NODE_ENV + '.json';

console.log('=]  Add additional items with command line params.  ex. --foo bar  [=');
console.log('=]   ** This file should not be checked into any public repos **   [=');
console.log('(info) maintaining file: ' + configFName);

if (!fs.existsSync(configFName)) {
  fs.writeFileSync(configFName, '{}');
}

//
// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'
//
nconf.argv()
  .env()
  .file({ file: configFName })
;


//
// Set a few variables on `nconf`.
//
nconf.set('Facebook:app_id', '[your_app_id_here]');
nconf.set('frontEndDebug', true);

//
// Get the entire database object from nconf. This will output
// { host: '127.0.0.1', port: 5984 }
//
console.log('NODE_ENV: ' + nconf.get('NODE_ENV'));
console.log('Facebook: ' + util.inspect(nconf.get('Facebook')));

//
// Save the configuration object to disk
//
nconf.save(function (err) {
  fs.readFile(configFName, function (err, data) {
    console.log('(info) wrote data to file: ' + util.inspect(JSON.parse(data.toString())));
  });
});