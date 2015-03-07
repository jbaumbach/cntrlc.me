
/*
 * GET home page.
 */

exports.requireHTTPS = function(req, res, next) {
  if (!req.secure && process.env.NODE_ENV !== "development") {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

exports.index = function(req, res){
  res.render('index', { 
    title: 'Controlc.me', 
    host: GLOBAL.SocketIO.Config.get('host'),
    FBAppId: GLOBAL.SocketIO.Config.get('Facebook:app_id')
  });
};