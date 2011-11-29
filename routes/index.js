/*
 * GET home page.
 */
var rest 		= require('restler'),
	apiPath 	= apiPath = 'http://onside.mini-apps.co.uk:80',
	onsideAuthKey = '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b73648';


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

exports.searchSave = function(req,res){
	if(req.xhr && req.user){
		var url = apiPath + '/search/save?user=' + req.user.id;
		console.log(url +'  //  '+ req.query);
		rest.post(url, {
			data: req.query,
			headers:{
				OnsideAuth : onsideAuthKey,
				Origin: 'http://dev.onside.me:1234',
				'Access-Control-Request-Method' : 'POST,GET,DELETE',
				'Access-Control-Request-Headers': 'OnsideAuth'
			}
		}).on('complete', function(data) {
			res.json(data);
		});
	}else{
		res.json({error: 'not logged in or invalid post'});
	}
};

exports.searchQuery = function(req,res){
	var url = apiPath + '/search?' + req.params.query;
	console.log(url);	
	rest.get(url,{
		headers:{
			OnsideAuth : onsideAuthKey,
			Origin: 'http://dev.onside.me:1234',
			'Access-Control-Request-Method' : 'POST,GET,DELETE',
			'Access-Control-Request-Headers': 'OnsideAuth'
		}
	}).on('complete', function(data) {
		res.json(data);
	});
};

exports.getApi = function(req,res){
	if(req.xhr){
		var path = req.url.replace('/api','');
		if(path.indexOf('/my/') !== -1) {
			path.replace('/my','');
			path += ( '?user=' + req.user.id );
		}
		
		var url = apiPath + path;
		console.log(url);
		rest.get(url,{
			headers:{
				OnsideAuth : onsideAuthKey,
				Origin: 'http://dev.onside.me:1234',
				'Access-Control-Request-Method' : 'POST,GET,DELETE',
				'Access-Control-Request-Headers': 'OnsideAuth'
			}
		}).on('complete', function(data) {
			res.json(data);
		});
		
	}else{
		res.redirect('/');
	}
};

exports.postApi = function(req,res){
	if(req.xhr){
		var path = req.url.replace('/api','');
		if(path.indexOf('/my/') !== -1) {
			path.replace('/my','');
			path += ( '?user=' + req.user.id );
		}
		
		var url = apiPath + path;
		console.log(url);
		rest.post(url,{
			data: req.body,
			headers:{
				OnsideAuth : onsideAuthKey,
				Origin: 'http://dev.onside.me:1234',
				'Access-Control-Request-Method' : 'POST,GET,DELETE',
				'Access-Control-Request-Headers': 'OnsideAuth'
			}
		}).on('complete', function(data) {
			res.json(data);
		});
		
	}else{
		res.redirect('/');
	}
};

exports.delApi = function(req,res){
	if(req.xhr){
		var path = req.url.replace('/api','');
		if(path.indexOf('/my/') !== -1) {
			path.replace('/my','');
			path += ( '?user=' + req.user.id );
		}
		
		var url = apiPath + path;
		rest.del(url,{
			headers:{
				OnsideAuth : onsideAuthKey,
				Origin: 'http://dev.onside.me:1234',
				'Access-Control-Request-Method' : 'POST,GET,DELETE',
				'Access-Control-Request-Headers': 'OnsideAuth'
			}
		}).on('complete', function(data) {
			res.json(data);
		});
		
	}else{
		res.redirect('/');
	}
};