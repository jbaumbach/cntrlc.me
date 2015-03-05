var redis = require("redis")
  ;

var client;

exports.getClient = function() {
  return client;
}

exports.connectToRedis = function(cb) {
  
  //
  // If there's a Redis environment variable, use that.  Otherwise,
  // assume local.
  //
  if (process.env.REDISCLOUD_URL) {
    var rtg = require("url").parse(process.env.REDISCLOUD_URL);
    client = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
  } else {
    client = redis.createClient();
  }

  client.on('connect', function() {
    console.log('(info) connected to redis ok');
    cb();
  });

  client.on('error', function(err) {
    console.log('(error) oops, redis connection error.  can\'t continue.  fix redis connection!')
    cb(err);
  });
}

