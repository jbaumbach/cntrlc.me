
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { 
    title: 'Signal.io Example', 
    host: GLOBAL.SocketIO.Config.get('host'),
    FBAppId: GLOBAL.SocketIO.Config.get('Facebook:app_id')
  });
};