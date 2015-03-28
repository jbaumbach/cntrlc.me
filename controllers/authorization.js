var async = require('async')
  , util = require('util')
  , tinyHttp = require(process.cwd() + '/lib/tinyHttp')
  , async = require('async')
  , redis = require(process.cwd() + '/lib/redis')
  , globalFunctions = require(process.cwd() + '/lib/global-functions')
  , socket = require(process.cwd() + '/lib/socket')
  , _ = require('underscore')
  , debug = require('debug')('sit:controllers:authorization')
  ;

exports.loginFb = function(req, res) {

  var userId = 'user:fbid:' + req.body.info.id;

  /*

   Redis schema:

   global_user_id: "user:fbid:[facebook_id]"

   "User" - Redis Hash (hmset/hget) with id global_user_id, various properties set
   "SessionUser" - Redis Key/Value (set/get) with key = new GUID and value = global_user_id.
   "UserSession" - Redis Key/Value (set/get) with key = global_user_id and value = session id from previous step.
   "UserItems" = Redis Sorted Set (zadd/zremrangebyzcore) with id = global_user_id and score is timestamp of the item

   */

  async.waterfall([
    function confirmIdentity(cb) {

      var fbAppId = GLOBAL.SocketIO.Config.get('Facebook:app_id');
      var fbAppSecret = GLOBAL.SocketIO.Config.get('Facebook:app_secret');

      //
      // If either of these happen, ensure you have the values from FB's admin page set in your config file.
      //
      if (!fbAppId) {
        return cb({status:500, msg: 'Missing FB app id'});
      } else if (!fbAppSecret) {
        return cb({status:500, msg: 'Missing FB app secret'});
      }

      var options = {
        secure: true,
        url: 'https://graph.facebook.com/debug_token?input_token=' + req.body.FBAuthResponse.accessToken +
        '&access_token=' + fbAppId + '|' + fbAppSecret,
        method: 'GET'
      };

      tinyHttp.executeCall(options, function(err, result) {
        if (err || !result) {
          cb({status: 502, msg: 'Unable to validate FB access token'});
        } else if (result.error) {
          cb({status: 502, msg: 'Error from FB: ' + util.inspect(result.error)});
        } else {
          if (req.body.FBAuthResponse.userID === result.data.user_id) {
            cb();
          } else {
            cb({status: 422, msg: 'FB token does not match user info'});
          }
        }
      });
    },
    function doSessionConfig(cb) {

      var redisClient = redis.getClient();
      var userItemsKey = 'useritems:' + userId;

      async.waterfall([
        function upsertUser(cb) {
          debug('have user id: ' + userId + ', upserting user record');
          redisClient.hmset(userId, req.body.info, function(err) {
            cb(err);
          });
        },
        function upsertSession(cb) {
          //"UserSession" - Redis Key/Value (set/get) with key = global_user_id and value = session id from previous step.  Expiry?
          //"SessionUser" - Redis Key/Value (set/get) with key = new GUID and value = global_user_id.  Expiry?

          var userSessionKey = 'usersession:' + userId;
          debug('looking up userSessionKey: ' + userSessionKey);
          redisClient.get(userSessionKey, function(err, response) {
            if (response) {
              debug('found session!');
              cb(null, response, true);
            } else {
              var sessionId = globalFunctions.generateUUID();
              debug('no session, setting one');
              redisClient.set(userSessionKey, sessionId, function(err) {
                cb(err, sessionId, false);
              });
            }
          });
        },
        function setSessionUser(sessionId, sessionWasPreexisting, cb) {
          //
          // Don't bother indexing the session-user, it's already there.
          //
          if (sessionWasPreexisting) {
            cb(null, sessionId, sessionWasPreexisting);
          } else {
            var sessionUserKey = 'sessionuser:' + sessionId;
            debug('setting sessionUserKey');
            redisClient.set(sessionUserKey, req.body.info.id, function(err) {
              cb(err, sessionId, sessionWasPreexisting);
            });
          }
        },
        function createUserSocket(sessionId, sessionWasPreexisting, cb) {
          
          //
          // This is called when data is posted to the room
          //
          var storageFunc = function(data, cb) {

            //
            // zadd format: key, score, value
            //
            var score = new Date().valueOf();
            var entry = [userItemsKey, score, JSON.stringify(data)];
            redisClient.zadd(entry, function(err) {
              cb(err, score);
            });
          };

          var deleteFunc = function(id, cb) {
            var score = id;
            debug('deleting id: ' + id);
            redisClient.zremrangebyscore(userItemsKey, score, score, cb);
          };

          //
          // Create (or recycle!) a socket.namespace, and set the above functions to be called whenever we get data
          //
          socket.createNamespace(sessionId, storageFunc, deleteFunc, function(err) {
            cb(err, sessionId);
          });
        }
      ], cb);
    }
  ], function returnResults(err, sessionId) {
    if (err) {
      console.log('got err: ' + util.inspect(err));
      res.status(500).send({msg: util.inspect(err)});
    } else {
      debug('done with everything, returning session id');
      res.status(200).send({sessionId: sessionId});
    }

  })

};