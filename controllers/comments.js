var debug = require('debug')('sit:controllers:authorization')
  , util = require('util')
  , async = require('async')
  , redis = require(process.cwd() + '/lib/redis')
  , _ = require('underscore')
;

//
// Middleware for authenticating a comments request
//
var authenticateSession = exports.authenticateSession = function(req, res, next) {
  function transportError(statusCode, message, cb) {
    res.set('WWW-Authenticate', 'Bearer error=' + message);
    cb({status:statusCode, msg: message});
  };
  
  var redisClient = redis.getClient();
  async.waterfall([
    function getSessionId(cb) {
      
      var authHeader = req.headers && req.headers.authorization;
      if (authHeader) {
        var authValues = req.headers.authorization.split(' ');
        if (authValues.length > 1) {
          cb(null, authValues[1]);
        } else {
          transportError(401, 'header must be of format "Bearer [sessionid]"', cb);
        }
      } else {
        transportError(401, 'missing Authorization header (format "Bearer [sessionid]")', cb);
      }
    },
    function getUserId(sessionId, cb) {
      var sessionUserKey = 'sessionuser:' + sessionId;
      redisClient.get(sessionUserKey, function(err, response) {
        if (err) { 
          debug('(error) cant get sessionUserKey ' + sessionUserKey + ', it was: ' + util.inspect(err));
          cb({status:500, msg: 'internal server error getting session'});
        } else {
          if (response) {
            var userId = 'user:fbid:' + response;
            cb(null, userId);
          } else {
            transportError(401, 'invalid or expired session id "' + sessionId + "", cb);
          }
        }
      });
    },
    function getAndSetUser(userId, cb) {
      redisClient.hgetall(userId, function(err, userData) {
        if (userData) {
          req.user = userData;
          cb();
        } else {
          debug('(error) unable to find user data for key: ' + userId);
          cb({status:500, msg: 'found session but unable to retrieve user'});
        }
      })
    }
  ], function(err) {
    if (err) {
      res.status(err.status).send(err.msg);
    } else {
      next();
    }
  });
};

exports.destroy = function(req, res) {
  var redisClient = redis.getClient();
  var userId = 'user:fbid:' + req.user.id;
  var userItemsKey = 'useritems:' + userId;
  var score = req.params.id;
  redisClient.zremrangebyscore(userItemsKey, score, score, function(err, result) {
    if (err) {
      res.status(500).send({msg: 'error removing comment: ' + err});
    } else {
      res.status(200).send({msg: 'ok'});
    }
  });
};

exports.index = function(req, res) {
  var redisClient = redis.getClient();
  async.waterfall([
    function getUserComments(cb) {
      var userId = 'user:fbid:' + req.user.id;
      var userItemsKey = 'useritems:' + userId;

      var offset = req.offset || 0;
      var limit = req.limit || 50;
      var searchArgs = [userItemsKey, offset, limit, 'WITHSCORES'];
      redisClient.zrevrange(searchArgs, function(err, results) {
        if (err) {
          cb({status:500, msg: 'error getting user items'});
        } else {

          var userItems = [];

          //
          // Redis returns items as a list having a value followed by timestamp
          // Convert this to an array of items with the timestamp as a property
          //
          _.map(results, function(result, index) {
            if (index % 2 === 0) {
              userItems.push(JSON.parse(result));
            } else {
              userItems[userItems.length - 1].timestamp = result;
            }
          });

          cb(null, userItems);
        }
      });
    }
  ], function(err, result) {
    if (err) {
      res.status(err.status).send({msg: err.msg});
    } else {
      res.status(200).send(result);
    }
  });
}