var debug = require('debug')('sit:controllers:authorization')
  , util = require('util')
;

exports.index = function(req, res) {
  debug('got headers: ' + util.inspect(req.headers));
  
  /*
    process:
    
    1. get user id for session id from Redis (should be middleware - Passport?)
    
    2. get user comments from redis - grab code from authorization.js function
    
    3. return them to the client
    
   */
  res.status(200).send([]);
}