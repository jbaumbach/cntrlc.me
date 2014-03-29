
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

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

ChatApp = {
  host: 'notset'
}

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  ChatApp.host = 'http://localhost:' + app.get('port');
}


//
// Repository for all our comments
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
