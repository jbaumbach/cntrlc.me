
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , app = express()
  ;

// all environments
app.set('port', process.env.PORT || 3010);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//
// Global namespace
//
ChatApp = {
  host: 'notset'
}

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  ChatApp.host = 'http://localhost:' + app.get('port');
}

// staging only
if ('staging' == app.get('env')) {
  app.use(express.errorHandler());
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
  res.send(200, comments);
})

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
