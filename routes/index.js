/*
 * GET home page.
 */

exports.index = function(req, res){
	if(req.loggedIn && req.user.enabled === '1'){
		res.render('index', { title: 'Onside', cssPath: '', jsPath:'' })
	} else if(req.loggedIn && req.user.enabled === '0'){
		res.render('index', { title: 'Onside', cssPath: '', jsPath:'' })
		//res.render('betaSignup', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:true })
	} else {
		res.render('betaSignup', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:false })
	}
};

exports.demo1 = function(req, res){
  res.render('demo1', { title: 'Onside', cssPath: '.demo1', jsPath:'' })
};