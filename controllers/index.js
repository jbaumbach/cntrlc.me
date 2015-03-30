var util = require('util')
  ;

exports.requireHTTPS = function(req, res, next) {
  //
  // The 'x-forwarded-proto' check is for Heroku
  //
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

exports.index = function(req, res){
  res.render('index', { 
    title: 'cntrlc.me', 
    host: GLOBAL.SocketIO.Config.get('host'),
    FBAppId: GLOBAL.SocketIO.Config.get('Facebook:app_id'),
    debugOutput: GLOBAL.SocketIO.Config.get('frontEndDebug') || false
  });
};