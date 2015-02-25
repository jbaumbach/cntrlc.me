var async = require('async')
  , util = require('util')
  , tinyHttp = require(process.cwd() + '/lib/tinyHttp')
  , async = require('async')
  , redis = require(process.cwd() + '/lib/redis')
  , globalFunctions = require(process.cwd() + '/lib/global-functions')
;  

//
// Here's what a sample response from FB looks like
//
var sampleFBBody = {
  FBAuthResponse: {
    accessToken: 'longcrazystring',
    userID: '000555111222112222',
    expiresIn: 4985,
    signedRequest: 'anotherlongcrazystring'
  },
  info: {
    id: '000555111222112222',
    email: 'youremail@gmail.com',
    first_name: 'Fred',
    gender: 'male',
    last_name: 'Jones',
    link: 'https://www.facebook.com/app_scoped_user_id/000555111222112222/',
    locale: 'en_US',
    name: 'Fred Jones',
    timezone: -8,
    updated_time: '2014-11-07T02:13:27+0000',
    verified: true
  }
}

exports.loginFb = function(req, res) {
  console.log('got body data: ' + util.inspect(req.body));
  var userId = 'user:fbid:' + req.body.info.id;

  /*

   Redis schema:

   global_user_id: "user:fbid:[facebook_id]"

   "User" - Redis Hash (hmset/hget) with id global_user_id, various properties set (easy?)
   "SessionUser" - Redis Key/Value (set/get) with key = new GUID and value = global_user_id.  Expiry?
   "UserSession" - Redis Key/Value (set/get) with key = global_user_id and value = session id from previous step.  Expiry?
   "UserItems" = Redis List (rpush/lrange) with id = global_user_id and values are the item

   (consider making these "Models")
    
   Architecture - idea #1:
  
  
  1. Take the posted FB response and call FB to validate it.
  
  see: https://developers.facebook.com/docs/facebook-login/login-flow-for-web/#confirm
  then: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/v2.2#checktoken
  
  Basically, 

   make a call to:

   GET graph.facebook.com/debug_token?
   input_token={token-to-inspect}
   &access_token={app-token-or-admin-token}
   
   the "input_token" is FBAuthResponse.accessToken
   the "app-token" is this:
   
   "There is another method to make calls to the Graph API that doesn't require using a generated app 
   token. You can just pass your app id and app secret as the access_token parameter when you make a 
   call":

   http://graph.facebook.com/endpoint?key=value&access_token=app_id|app_secret"
   
   
  2. If FB validates the request (comparing user info?), then we can log the user in.
  
  Look up FB user id in Redis.  If it does not exist, store user info.

  3. Create session by inserting table(s).  Pass session id back to client
  
  4. Client passes session id with every Websocket post
  
  5. Websockets use session id as unique room key / id
  
  6. After login, all "UserItems" passed back to client for display in order


  */
  
  async.waterfall([
    function confirmIdentity(cb) {
      var options = {
        secure: true,
        url: 'https://graph.facebook.com/debug_token?input_token=' + req.body.FBAuthResponse.accessToken +
          '&access_token=' + GLOBAL.SocketIO.Config.get('Facebook:app_id') + 
          '|' + GLOBAL.SocketIO.Config.get('Facebook:app_secret'),
        method: 'GET'
      };
      
      console.log('calling FB, going to use options: ' + util.inspect(options));
      
      tinyHttp.executeCall(options, function(err, result) {
        if (err) {
          cb({status: 502, msg: 'Unable to validate FB access token'});
        } else {
          console.log('got result: ' + util.inspect(result));
          
          if (req.body.FBAuthResponse.userID === result.data.user_id) {
            cb();
          } else {
            cb({status: 422, msg: 'FB token does not match user info'});
          }
        }

        //{
        //  data: {
        //    app_id: '592373607574396',
        //      application: 'Socketio Chat - LocalDev',
        //      expires_at: 1424761200,
        //      is_valid: true,
        //      scopes: [
        //      'public_profile',
        //      'email'
        //    ],
        //      user_id: '10204941785718115'
        //  }
        //}
        
      });
    },
    function getRedisSession(cb) {
      
      var client = redis.getClient();
      
      async.waterfall([
        function upsertUser(cb) {
          console.log('have user id: ' + userId + ', inserting user record');
          client.hmset(userId, req.body.info, function(err) {
            cb(err);
          });
        },
        function upsertSession(cb) {
          //"UserSession" - Redis Key/Value (set/get) with key = global_user_id and value = session id from previous step.  Expiry?
          //"SessionUser" - Redis Key/Value (set/get) with key = new GUID and value = global_user_id.  Expiry?

          var userSessionKey = 'usersession:' + userId;
          console.log('looking up userSessionKey: ' + userSessionKey);
          client.get(userSessionKey, function(err, response) {
            if (response) {
              console.log('found session, returning session id: ' + response);
              cb(null, response);
            } else {
              var sessionId = globalFunctions.generateUUID(); 
              console.log('no session, setting one to: ' + sessionId);
              client.set(userSessionKey, sessionId, function(err) {
                console.log('cb: ' + cb + ', err: ' + err + ', sessionId: ' + sessionId);
                cb(err, sessionId);
              });
            }
          });
          
        },
        function setSessionUser(sessionId, cb) {
          var sessionUserKey = 'sessionuser:' + sessionId;
          console.log('setting sessionUserKey: ' + sessionUserKey);
          client.set(sessionUserKey, req.body.info.id, function(err) {
            cb(err, sessionId);
          });
        }
      ], cb);
    }
  ], function(err, result) {
    if (err) {
      console.log('got err: ' + util.inspect(err));
      res.status(500).send({msg: util.inspect(err)});
    } else {
      console.log('done with everything, returning session id: ' + util.inspect(result));
      res.status(200).send({sessionId: result});
    }

  })
  
};