
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { 
    title: 'Signal.io Example', 
    host: ChatApp.host,
    FBAppId: GLOBAL.SocketIO.Config.get('Facebook:app_id')
  });
};