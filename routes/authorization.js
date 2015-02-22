var async = require('async')
  util = require('util')
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
  console.log('got data: ' + util.inspect(req.body));
  
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
   
   "There is another method to make calls to the Graph API that doesn't require using a generated app token. You can just pass your app id and app secret as the access_token parameter when you make a call:

   http://graph.facebook.com/endpoint?key=value&access_token=app_id|app_secret"
   
   
  2. If FB validates the request (comparing user info?), then we can log the user in.
  
  Look up FB user id in Redis.  If it does not exist, store user info.

  3. Create session by inserting table(s).  Pass session id back to client
  
  4. Client passes session id with every Websocket post
  
  5. Websockets use session id as unique room key / id
  
  6. After login, all "UserItems" passed back to client for display in order


  */
  
  
  res.status(500).send('not implemented!');
}