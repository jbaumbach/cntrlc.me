require(process.cwd() + '/config/config');

var express = require('express')
  , routes = require('./controllers')
  , http = require('http')
  , path = require('path')
  , app = express()
  , favicon = require('serve-favicon')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , errorhandler = require('errorhandler')
  , authorizationController = require(process.cwd() + '/controllers/authorization')
  , commentsController = require(process.cwd() + '/controllers/comments')
  , async = require('async')
  , util = require('util')
  , redis = require(process.cwd() + '/lib/redis')
  , socket = require(process.cwd() + '/lib/socket')
  , debug = require('debug')('sit:app')
;

//
// Node Server startup
//

//
// Export the express app, mainly for use in tests
//
exports.app = app;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// From: http://uxrepo.com/icon-sets/ionicons
app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(routes.requireHTTPS);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('production' !== app.get('env')) {
  app.use(errorhandler());
}

//
// Routes - can eventually be moved to routes controller
//
app.get('/', routes.index);
app.post('/loginfb', authorizationController.loginFb);
app.get('/api/v1/comments', commentsController.authenticateSession, commentsController.index);


//
// Start the Express server
//
var server = http.createServer(app);

//
// Set up required application systems.  Some systems require other systems to run first, so use async.auto.
//
async.auto({
  db: function(cb) {
    redis.connectToRedis(function(err) {
      if (err) {
        err = 'Ensure redis is started and reachable!';
      }
      cb(err);
    });
  },
  server: function(cb) {
    //
    // Main site
    //
    server.listen(app.get('port'), function(){
      console.log('(info) Express server listening on port ' + app.get('port'));
      cb();
    });
  },
  sockets: ['db', function(cb) {
    //
    // Socket listener.  Gets messages from the clients and rebroadcasts them
    // to all the other clients.
    //
    socket.start(server, cb);
    
  }]
}, function(err, results) {
  if (err) {
    console.log('error starting up: ' + util.inspect(err));
    process.exit(1);
  } else {
    console.log('> to see debug messages in console, set environment variable: $ DEBUG=sit:* nodemon app.js');
    console.log('> to see debug messages on the front end console, set frontEndDebug in the environment config file');
    console.log('* current DEBUG env: ' + (process.env.DEBUG || '[none]'));
    console.log('*********************');
    console.log('** all systems go! **');
    console.log('*********************');
  }
});



