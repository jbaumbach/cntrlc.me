
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./controllers')
  , http = require('http')
  , path = require('path')
  , app = express()
  , favicon = require('serve-favicon')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , errorhandler = require('errorhandler')
  , config = require(process.cwd() + '/config/config')
  , authorizationController = require(process.cwd() + '/controllers/authorization')
  , commentsController = require(process.cwd() + '/controllers/comments')
  , async = require('async')
  , util = require('util')
  , redis = require(process.cwd() + '/lib/redis')
  , socket = require(process.cwd() + '/lib/socket')
  , debug = require('debug')('sit:app')
;

//
// Export the express app, mainly for use in tests
//
exports.app = app;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//app.use(favicon(__dirname + '/public/favicon.ico'));  // todo: create icon

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//
// Global namespace
//
// todo: delete this, use the one in config.js, and change to "controlc"
//
ChatApp = {
  host: 'notset'
}

// development only
if ('development' == app.get('env')) {
  app.use(errorhandler());
  ChatApp.host = 'http://localhost:' + app.get('port');
}

// staging only
if ('staging' == app.get('env')) {
  app.use(errorhandler());
  ChatApp.host = 'http://socketio-chat.herokuapp.com';
}

// production
if ('production' == app.get('env')) {
  ChatApp.host = 'http://socketio-chat.herokuapp.com';
}

//
// Routes - can eventually be moved to routes controller
//
app.get('/', routes.index);
app.post('/loginfb', authorizationController.loginFb);
app.get('/api/v1/comments', commentsController.index);


//
// Start the Express server
//
var server = http.createServer(app);

//
// Set up required application systems 
//
async.parallel({
  db: function(cb) {
    redis.connectToRedis(cb);
  },
  server: function(cb) {
    //
    // Main site
    //
    server.listen(app.get('port'), function(){
      debug('(info) Express server listening on port ' + app.get('port'));
      cb();
    });
  },
  sockets: function(cb) {
    //
    // Socket listener.  Gets messages from the clients and rebroadcasts them
    // to all the other clients.
    //
    var io = socket.start(server);
    
    cb(io ? null : 'cannot start socket server');
  }
}, function(err, results) {
  if (err) {
    debug('error starting up: ' + util.inspect(err));    
  } else {
    debug('*********************');
    debug('** all systems go! **');
    debug('*********************');
  }
});



