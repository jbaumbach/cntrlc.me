
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , app = express()
  , favicon = require('serve-favicon')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , errorhandler = require('errorhandler')
  , config = require(process.cwd() + '/config/config')
  , authorizationController = require(process.cwd() + '/routes/authorization')
  , async = require('async')
  , util = require('util')
  , redis = require(process.cwd() + '/lib/redis')
  , socket = require(process.cwd() + '/lib/socket')
;

// all environments
app.set('port', process.env.PORT || 3010);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//app.use(favicon(__dirname + '/public/favicon.ico'));  // todo: create icon

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//
// Global namespace
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
// Repository for all our comments.  Only suitable for development!  Does not
// take into consideration persistence or multiple servers.
//
var comments = [];

app.get('/', routes.index);
app.post('/loginfb', authorizationController.loginFb);

//
// Support for getting server comments on initial page load
//
app.get('/api/v1/comments', function(req, res) {
  // console.log('got headers: ' + util.inspect(req.headers));
  res.status(200).send(comments);
});

var server = http.createServer(app);

//
// Start the socket.io server
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
      console.log('(info) Express server listening on port ' + app.get('port'));
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
    console.log('error starting up: ' + util.inspect(err));    
  } else {
    console.log('*********************');
    console.log('** all systems go! **');
    console.log('*********************');
  }
});



