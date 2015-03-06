
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { 
    title: 'Controlc.me', 
    host: GLOBAL.SocketIO.Config.get('host'),
    FBAppId: GLOBAL.SocketIO.Config.get('Facebook:app_id')
  });
};