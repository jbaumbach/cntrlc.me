var async = require('async')
  util = require('util')
  ;

exports.loginFb = function(req, res) {
  console.log('got data: ' + util.inspect(req.body));
  
  res.status(500).send('not implemented!');
}