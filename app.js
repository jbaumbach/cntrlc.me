
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

//
// Support for getting server comments on initial page load
//
app.get('/api/v1/comments', function(req, res) {
  res.status(200).send(comments);
});

var server = http.createServer(app);

//
// Start the socket.io server
//
var io = require('socket.io').listen(server);

//
// Main site
//
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//
// Socket listener.  Gets messages from the clients and rebroadcasts them
// to all the other clients.
//
io.sockets.on('connection', function (socket) {
  socket.on('addComment', function (data) {
    comments.push(data);
    socket.broadcast.emit('addedComment', data);
  });
});
