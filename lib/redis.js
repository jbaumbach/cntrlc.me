var redis = require('redis')
  , util = require('util')
  ;

var client;

exports.getClient = function() {
  return client;
};

var createClient = exports.createClient = function(cb) {
  
  //
  // If there's a Redis environment variable, use that.  Otherwise,
  // assume local.
  //
  //
  // todo: simplify this logic with nconf
  //
  var client;
  
  if (process.env.REDISCLOUD_URL) {
    var rtg = require("url").parse(process.env.REDISCLOUD_URL);
    client = redis.createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(":")[1]);
  } else {
    client = redis.createClient();
  }

  client.on('connect', function() {
    console.log('(info) connected to redis ok');
    cb(null, client);
  });

  var hasCalledBack = false;
  client.on('error', function(err) {
    if (!hasCalledBack) {
      hasCalledBack = true;
      console.log('(error) oops, redis connection error: ' + util.inspect(err));
      cb(err);
    }
  });
};

exports.connectToRedis = function(cb) {
  createClient(function(err, newClient) {
    client = newClient;
    cb(err);
  })
};

