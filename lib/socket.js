var util = require('util')
  ;

var ioSocket = require('socket.io');
var io;

//exports.listen = function(server) {
//  io.listen(server);
//}

exports.start = function(server) {
  io = ioSocket(server)
  return io;
}

exports.getIo = function() { 
  return io;
}


exports.createNamespace = function(namespaceId, storageFunc, cb) {
  //
  // Socket listener.  Gets messages from the clients and rebroadcasts them
  // to all the other clients.
  //

  var namespaceId = '/' + namespaceId; 
  var nsp = io.of(namespaceId);
  console.log('created socket namespace: ' + namespaceId);
  
  nsp.on('connection', function(socket){
    console.log('got connection!');
    socket.on('addComment', function(data) {
      storageFunc(data, function(err, result) {
        if (err) {
          console.log('(error) can\'t save data! ' + util.inspect(err));
        }
        socket.broadcast.emit('addedComment', data);
      })
    });
  });
  
  cb();
}