var util = require('util')
  debug = require('debug')('sit:lib:socket')
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

  var ioNamespaceId = '/' + namespaceId;

  if (io.has(ioNamespaceId)) {
    debug('reusing existing namespace: ' + ioNamespaceId);
  } else {
    var nsp = io.of(ioNamespaceId);
    debug('created socket namespace: ' + ioNamespaceId);

    nsp.on('connection', function(socket){
      debug('got connection!');
      socket.on('addComment', function(data) {
        storageFunc(data, function(err, result) {
          if (err) {
            debug('(error) can\'t save data! ' + util.inspect(err));
          }
          socket.broadcast.emit('addedComment', data);
        });
      });
    });
  }

  //
  // Note: the callback is (purposely) outside of the namespace creation 
  // block.
  //
  cb();
};