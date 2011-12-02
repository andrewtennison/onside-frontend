/*
 * GET home page.
 */
var rest 		= require('restler');
	Config 		= require('../lib/conf'),
	conf 		= new Config();

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
		var url = conf.apiPath + '/search/save?user=' + req.user.id;
		console.log(url +'  //  '+ req.query);
		rest.post(url, {
			data: req.query,
			headers:{
				OnsideAuth : conf.onsideAuthKey,
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
	var url = conf.apiPath + '/search?' + req.params.query;
	console.log(url);	
	rest.get(url,{
		headers:{
			OnsideAuth : conf.onsideAuthKey,
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
		
		var url = conf.apiPath + path;
		console.log(url);
		rest.get(url,{
			headers:{
				OnsideAuth : conf.onsideAuthKey,
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
		
		var url = conf.apiPath + path;
		console.log(url);
		rest.post(url,{
			data: req.body,
			headers:{
				OnsideAuth : conf.onsideAuthKey,
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
		
		var url = conf.apiPath + path;
		rest.del(url,{
			headers:{
				OnsideAuth : conf.onsideAuthKey,
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

exports.cms = function(req,res){
	//if(req.loggedIn && req.user.admin === '0'){
		res.render('addcontent', { title: 'Add Content', cssPath: '.cms', jsPath:'.cms' });
	//} else {
	//	res.redirect('/', 401);
	//	}
}