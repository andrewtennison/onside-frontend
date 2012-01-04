/*
 * GET home page.
 */
var rest 		= require('restler');
	Config 		= require('../lib/conf'),
	conf 		= new Config();

var preload = function(req, callback){
	var content = {},
		i = 0,
		timer = setInterval ( onComplete, 100 ),
		user = req.user,
		userString = (user)? '?user=' + user.id : '';

	var getFirstArticle = function( channel, index, length, callback ){
		var url = conf.apiPath + '/article?channel='+channel.id+'&limit=1',
			req = {index:index};
		
		console.log(index +' / '+length+' / '+url)
		
		rest.get(url)
			.on('success', function(data){ 
				req.defaultArticle = data.resultset.articles[0];
				callback(req);
			})
			.on('error', function() { 
				req.defaultArticle = undefined;
				callback(req);
			});
	};

	
	// get channels
	console.log(conf.apiPath + '/channel' + userString)
	rest.get(conf.apiPath + '/channel' + userString)
		.on('success', function(data) {
			console.log('////////////////////// success channel ')
			var channels = data.resultset.channels,
				l = channels.length,
				ii = 0,
				j = 0;		// tracks how many callbacks complete as dont execute in order
				
			if(l >= 1){
				for(ii; ii < l; ii++){
					getFirstArticle(channels[ii], ii, l, function(req){
						channels[req.index].defaultArticle = req.defaultArticle;
						j += 1;
						if( j === l ){
							console.log('Preload of article for each channel complete')
							content.channels = JSON.stringify(channels);
							content.channelsLoaded = true;
						}else{
							content.channelsLoaded = false;
						}
					});
				};
			}else{
				content.loadChannels = true;
				return content.channels = false;
			}
		})
		.on('error', function() { return content.channels = undefined; });

	// get events
	console.log(conf.apiPath + '/event' + userString)
	rest.get(conf.apiPath + '/event' + userString)
		.on('success', function(data) { content.events = (data.resultset.events.length >= 1)? JSON.stringify(data.resultset.events) : false })
		.on('error', function() { content.events = undefined})
		.on('complete', function(){ content.eventsLoaded = true });

	// get searches if user exist
	console.log(conf.apiPath + '/search/list' + userString)
	if(user) {
		rest.get(conf.apiPath + '/search/list' + userString)
			.on('success', function(data) { return content.searches = (data.resultset.searches.length >= 1)? JSON.stringify(data.resultset.searches) : false })
			.on('error', function() { return content.channels = undefined})
			.on('complete', function(){ content.searchesLoaded = true });
	}
	
	function onComplete(){
		if(content.channelsLoaded && content.eventsLoaded && content.searchesLoaded){
			console.log('Preloading complete')
			clearInterval( timer );
			callback(content);
		} else if(i === 30000){
			console.log('API timed out, timer = ' + i)
			clearInterval( timer );
			callback(content);
		} else{
			i += 100;
			console.log('proloading content from API, timer = ' + i)
		}
	}
	
};

var checkAuth = function(opts){
	var user = opts.req.user,
		loggedIn = opts.req.loggedIn,
		stage = false;

	// logged in
	if(!loggedIn) {
		opts.fail();
		return;
	};
	
	switch(user.enabled){
		case '0':			// default - user new, not yet invited
			opts.fail(loggedIn);
			return;
		case '1':						// user has been sent invite - more info/action required
		case '2':						// user has visited site and completed required signup tasks
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
			stage = 'stage' + user.enabled;
			break;
		case '9':						// user is suspended
			(opts.reject)? opts.reject() : res.render('pages/suspended.ejs');
			return;
		
		default:
			console.log('routes.checkAuth - user.enabled unknow =' + user.enabled)
			opts.fail();
			return;
	};
	
	if(opts.preload){
		preload(opts.req, function(json){
			console.log('/////////////////////////// json');
			console.log(json);
			var content = {channels: json.channels, events: json.events, searches: json.searches};
			( opts[stage] )? opts[stage](content) : opts.pass(content);
		});
	}else{
		var content = {channels: [], events: [], searches: []};
		( opts[stage] )? opts[stage](content) : opts.pass(content);
	}
}

exports.index = function(req, res){
	checkAuth({
		req: req,
		res: res,
		preload: true,
		pass: function(content){
			res.render('pages/index', { title: 'Onside', cssPath: '', jsPath:'', channels: content.channels, events: content.events, searches: content.searches });
		},
		fail: function(loggedIn){
			res.render('pages/signup.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:loggedIn })
		}
		// other options = ,rejected:function(){}, stage1:function(){}, stage2:function(){}, stage3:function(){}, stage4:function(){}, stage5:function(){}, stage6:function(){}, stage7:function(){}, stage8:function(){}
	});
/*
	var user = req.user;
	var preload = true;
	
	if(req.loggedIn && user.enabled === '1'){
		console.log('routes.index, user enabled + logged in, preload content, req.user = ');

		if(preload){
			preload(req, '', function(content){
				console.log('res.render with preload')
				res.render('pages/index', { title: 'Onside', cssPath: '', jsPath:'', channels: content.channels, events: content.events, searches: content.searches });
			});
		}else{
			console.log('res.render NO preload')
			res.render('pages/index', {title: 'Onside', cssPath: '', jsPath:'', channels: [], events: [], searches: [] });
		}
		
	} else if(req.loggedIn && user.enabled === '0'){
		console.log('routes.index, user NOT enabled + logged in');
		console.log(user);
		res.render('pages/signup_complete.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:true })
	} else {
		res.render('pages/signup.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:false })
	}
	*/
};

exports.demo1 = function(req, res){
  res.render('pages/demo1', { title: 'Onside', cssPath: '.demo1', jsPath:'' })
};

exports.demo2 = function(req, res){
	res.render('pages/demo1', { title: 'Onside', cssPath: '.demo2', jsPath:'' })
};


function callApi(req, res, action, authRequired, callback){
	var response = {};
	if(authRequired && !req.loggedIn){
		response.error = 'User must be logged in to perform this action';
		console.err('user must be auth')
		callback(response);
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
		//console.log(obj);
		
		rest[action](url,obj).on('complete', function(data) {
			//console.log('data //////////')
			//console.log(data)
			// res.json(data);
			response.success = data;
			callback(response);
		}).on('error', function(err){
			console.error(err);
			//res.send('error calling API')
			response.error = 'error calling API';
			callback(response);
		});
		
	}else{
		res.redirect('/');
	}
	
};

exports.getApi = function(req,res){
	callApi(req, res, 'get', false, function(r){
		(r.error)? res.send(r.error) : res.json(r.success);
	});
};

exports.postApi = function(req,res){
	if((/(\/follow|\/unfollow|\/search\/save)/gi).test(req.url)){
		callApi(req, res, 'post', true, function(r){
			(r.error)? res.send(r.error) : res.json(r.success);
		});
	}else{
		callApi(req, res, 'post', false, function(){
			(r.error)? res.send(r.error) : res.json(r.success);
		});
	}
};

exports.delApi = function(req,res){
	 callApi(req, res, 'del', true, function(){
		(r.error)? res.send(r.error) : res.json(r.success);
	 });
};

exports.getDetailApi = function(req,res){
	var action = req.params.action,
		id = req.params.id,
		timer = setInterval ( onComplete, 100 ),
		i = 0,
		content = {
			// author	: this should be returned in list of related objects
			// title	: set when channels call responds
			id			: 'detail|' + action +'|'+id,
			originUId 	: action +'|'+id,
			channels	: false,
			events 		: false,
			articles 	: false
		};
	

	req.url = '/channel?'+action+'='+id;
	callApi(req, res, 'get', false, function(r){
		content.channels = (r.success)? r.success.resultset.channels : false;
	});

	req.url = '/event?'+action+'='+id;
	callApi(req, res, 'get', false, function(r){
		content.events = (r.success)? r.success.resultset.events : false;
	});

	req.url = '/article?'+action+'='+id + '&limit=30';
	callApi(req, res, 'get', false, function(r){
		content.articles = (r.success)? r.success.resultset.articles : false;
	});
	
	function setAuthor(){
		console.log('get Author, action = ' + action);

		var actions = action + 's',
			arr = content[actions],
			l = arr.length | 0;
		
		while(l--){
			if(arr[l].id === id){
				content.author = arr[l];
				content.title = arr[l].name;
				return;
			};
		}
	};

	function onComplete(){
		if(content.channels && content.events && content.articles){
			setAuthor();
			clearInterval( timer );
			res.json(content)
		} else if(i === 30000){
			console.log('API timed out, timer = ' + i)
			clearInterval( timer );
			res.send('load detailed failed, request timed out')
		} else{
			i += 100;
			console.log('load detail content from API, timer = ' + i)
		}
	}

};

exports.cms = function(req,res){
	if(process.env.NODE_ENV === 'development' || (req.loggedIn && req.user.admin === '1') ){
		res.render('pages/cms', { title: 'Add Content', cssPath: '.cms', jsPath:'.cms' });
	} else {
		res.redirect('/', 401);
	}
}