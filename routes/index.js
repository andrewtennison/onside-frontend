/*
 * GET home page.
 */
var rest 		= require('restler');
	Config 		= require('../lib/conf'),
	conf 		= new Config();

exports.index = function(req, res){
	console.log(req.user)
	if(req.loggedIn && req.user.enabled === '1'){
		res.render('index', { title: 'Onside', cssPath: '', jsPath:'' })
	} else if(req.loggedIn && req.user.enabled === '0'){
		res.render('betaSignup', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:true })
	} else {
		res.render('betaSignup', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:false })
	}
};

exports.demo1 = function(req, res){
  res.render('demo1', { title: 'Onside', cssPath: '.demo1', jsPath:'' })
};

var searchSave = function(req,res){
	if(req.xhr && req.user.enabled){
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

function callApi(req, res, action, authRequired){
	if(authRequired && !req.loggedIn){
		res.send('User must be logged in to perform this action');
		console.err('user must be auth')
		return;
	};
	
	if(req.xhr){
		console.log('/////////////// = ' + req.url)
		
		var path = req.url.replace('/api',''),
			url = conf.apiPath;
			obj	= {
				headers:{
					OnsideAuth : conf.onsideAuthKey,
					Origin: 'http://dev.onside.me:1234',
					'Access-Control-Request-Method' : 'POST,GET,DELETE',
					'Access-Control-Request-Headers': 'OnsideAuth'
				}
			};
		
		switch(action){
			case 'post':
				obj.data = req.body;
				if(req.loggedIn) obj.data.user = req.user.id;
				break;
			case 'get':
				if(req.loggedIn) path += ((path.indexOf('?') === -1)? '?' : '&') + 'user=' + req.user.id;
				break

			case 'del':
			default:
				console.log('API Call - do nothing with params or body');
				break;
		}
		url += path;
				
		console.log('callAPI - ' + action + ' to - ' + url);
		console.log(obj);
		
		rest[action](url,obj).on('complete', function(data) {
			console.log('data //////////')
			console.log(data)
			res.json(data);
		}).on('error', function(err){
			console.error(err)
		});
		
	}else{
		res.redirect('/');
	}
	
};

exports.getApi = function(req,res){
	 callApi(req, res, 'get');
};

exports.postApi = function(req,res){
	// if((/\/search/gi).test(req.url)){
		// searchSave(req,res);
	// }else 
	if((/(\/follow|\/unfollow|\/search\/save)/gi).test(req.url)){
		callApi(req, res, 'post', true);
	}else{
		callApi(req, res, 'post');
	}
};

exports.delApi = function(req,res){
	 callApi(req, res, 'del');
};

exports.cms = function(req,res){
	if(req.loggedIn && req.user.admin === '1'){
		res.render('addcontent', { title: 'Add Content', cssPath: '.cms', jsPath:'.cms' });
	} else {
		res.redirect('/', 401);
	}
}