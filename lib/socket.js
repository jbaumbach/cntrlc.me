var util = require('util')
  , debug = require('debug')('sit:lib:socket')
  , ioSocket = require('socket.io')
  ;

var io;

exports.start = function(server, cb) {
  
  io = ioSocket(server);
  cb(null, io);
  
};

exports.getIo = function() { 
  return io;
};


exports.createNamespace = function(namespaceId, storageFunc, deleteFunc, cb) {
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
        storageFunc(data, function(err, id) {
          if (err) {
            debug('(error) can\'t save data! ' + util.inspect(err));
          } else {
            //
            // Update the received data with the id (timestamp) so other
            // clients have it just in case it's deleted.
            //
            data.timestamp = id;

            //
            // Broadcast to all OTHER sockets
            //
            socket.broadcast.emit('addedComment', data);

            //
            // Broadcast to ONLY this socket
            //
            socket.emit('addedComment', data);
          }
        });
      });
      
      socket.on('deleteComment', function(id) {
        debug('got deletedComment event: ' + id);
        deleteFunc(id, function(err) {
          if (err) {
            debug('(error) can\'t delete data! ' + util.inspect(err));
          } else {
            socket.broadcast.emit('deletedComment', id);
            socket.emit('deletedComment', id);
          }
        });
      })
    });
  }

  //
  // Note: the callback is (purposely) outside of the namespace creation 
  // block.
  //
  cb();
};