var redis = require("redis")
  ;

var client;

exports.getClient = function() {
  return client;
}

exports.connectToRedis = function(cb) {
  
  client = redis.createClient();

  client.on('connect', function() {
    console.log('(info) connected to redis ok');
    cb();
  });

  client.on('error', function(err) {
    console.log('(error) oops, redis connection error.  can\'t continue.  fix redis connection!')
    cb(err);
  });
}

