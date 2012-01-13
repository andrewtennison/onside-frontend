/*
 * GET home page.
 */
var rest 		= require('restler'),
	Config 		= require('../lib/conf'),
	conf 		= new Config();

var preload = function(req, callback){
	var content = {},
		i = 0,
		timer = setInterval ( onComplete, 100 ),
		user = req.user,
		userString = (user)? '?user=' + user.id : '?user=1';

	var getFirstArticle = function( channel, index, length, callback ){
		var url = conf.apiPath + '/article?channel='+channel.id+'&limit=1',
			req = {index:index};
		
		console.log(index +' / '+length+' / '+url)
		
		rest.get(url)
			.on('success', function(data){ 
				req.defaultArticle = data.resultset.articles[0];
				//req.defaultArticle = undefined;
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
							content.channelsLoaded = true;
							content.channels = JSON.stringify(channels);
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
	rest.get(conf.apiPath + '/search/list' + userString)
		.on('success', function(data) { return content.searches = (data.resultset.searches.length >= 1)? JSON.stringify(data.resultset.searches) : false })
		.on('error', function() { return content.channels = undefined})
		.on('complete', function(){ content.searchesLoaded = true });
	
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
			console.log('proloading content from API, timer = ' + i + '//'+ content.channelsLoaded +' // '+ content.eventsLoaded +' // '+ content.searchesLoaded)
		}
	}
};

var checkAuth = function(opts){
	if(opts.req == undefined || opts.res == undefined) { console.log('routes.index.checkAuth - req/res not defined'); return; };

	var user = opts.req.user || {},
		res = opts.res,
		loggedIn = opts.req.loggedIn,
		stage = false;

	// logged in
	if(!loggedIn && opts.authReq) {
		opts.fail(res,loggedIn);
		return;
	};
	
	var userStatus = (!opts.authReq && user.enabled === undefined)? '1' : user.enabled;

	switch(userStatus){
		case '0':			// default - user new, not yet invited
			opts.fail(res,loggedIn);
			return;
		case '1':						// user has been sent invite - more info/action required
		case '2':						// user has visited site and completed required signup tasks
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
			stage = 'stage' + userStatus;
			break;
		case '9':						// user is suspended
			opts.reject(res,loggedIn);
			return;
		
		default:
			console.log('routes.checkAuth - user.enabled unknow =' + userStatus)
			opts.fail(res,loggedIn);
			return;
	};
	
	if(opts.preload){
		preload(opts.req, function(json){
			var content = {channels: json.channels, events: json.events, searches: json.searches};
			( opts[stage] )? opts[stage](res,loggedIn,content) : opts.pass(res,loggedIn,content);
		});
	}else{
		var content = {channels: undefined, events: undefined, searches: undefined};
		( opts[stage] )? opts[stage](res,content) : opts.pass(res,loggedIn,content);
	}
}

// Base object for checkAuth function
baseAuthObject = {
	pass	: function(res, loggedIn, content){ res.render('pages/index', { title: 'Onside', cssPath: '', jsPath:'', loggedIn:loggedIn, channels: content.channels, events: content.events, searches: content.searches }); },
	fail	: function(res, loggedIn){ res.render('pages/signup.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:loggedIn }) },
	reject	: function(res){  res.render('pages/suspended.ejs'); },
	preload	: true,
	authReq	: true
	// other options = ,stage1:function(){}, stage2:function(){}, stage3:function(){}, stage4:function(){}, stage5:function(){}, stage6:function(){}, stage7:function(){}, stage8:function(){}
}

exports.index = function(req, res){
	baseAuthObject.req = req;
	baseAuthObject.res = res;
	
	// for new dev
	baseAuthObject.preload = true;
	baseAuthObject.authReq = true;	
	baseAuthObject.pass = function(res,loggedIn, content){ res.render('pages/index-1.0.ejs', { title: 'Onside', cssPath: '.index-1.0', jsPath:'', loggedIn:loggedIn, channels: content.channels, events: content.events, searches: content.searches }) }; 
	checkAuth( baseAuthObject );
	//baseAuthObject.pass(res, false)
};

exports.demo1 = function(req, res){
	baseAuthObject.req = req;
	baseAuthObject.res = res;
	baseAuthObject.preload = false;
	baseAuthObject.pass = function(res){ res.render('pages/demo1', { title: 'Onside', cssPath: '.demo1', jsPath:'', channels: [], events: [], searches: [] }) }; 
	checkAuth( baseAuthObject );
};

exports.demo2 = function(req, res){
	baseAuthObject.req = req;
	baseAuthObject.res = res;
	baseAuthObject.preload = true;
	baseAuthObject.pass = function(res,loggedIn, content){ res.render('pages/demo1', { title: 'Onside', cssPath: '.index-1.0', jsPath:'', loggedIn:loggedIn, channels: content.channels, events: content.events, searches: content.searches }) }; 
	checkAuth( baseAuthObject );
};

exports.demo3 = function(req, res){
	baseAuthObject.req = req;
	baseAuthObject.res = res;
	baseAuthObject.preload = false;
	baseAuthObject.pass = function(res){ res.render('pages/demo3', { title: 'Onside', cssPath: '.demo3', jsPath:'', channels: [], events: [], searches: [] }) }; 
	checkAuth( baseAuthObject );
};


function callApi(req, res, action, authRequired, forceUser, callback){
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
		
		var UID = (req.loggedIn)? req.user.id : 1;
		
		switch(action){
			case 'post':
				obj.data = req.body;
				if(req.loggedIn && forceUser) obj.data.user = UID;
				break;
			case 'get':
				if(req.loggedIn && forceUser) path += ((path.indexOf('?') === -1)? '?' : '&') + 'user=' + UID;
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
			console.log(data);
			data.auth = req.loggedIn;
			response.success = data;
			callback(response);
		}).on('error', function(err){
			console.error(err);
			response.error = 'error calling API';
			callback(response);
		});
		
	}else{
		res.redirect('/');
	}
	
};

exports.getApi = function(req,res){
	callApi(req, res, 'get', false, true, function(r){
		(r.error)? res.send(r.error) : res.json(r.success);
	});
};

exports.postApi = function(req,res){
	console.log(req.url);
	console.log((/(\/follow|\/unfollow|\/search\/save)/gi).test(req.url))
	
	if((/(\/follow|\/unfollow|\/search\/save)/gi).test(req.url)){
		callApi(req, res, 'post', true, false, function(r){
			(r.error)? res.send(r.error) : res.json(r.success);
		});
	}else{
		callApi(req, res, 'post', false, false, function(r){
			(r.error)? res.send(r.error) : res.json(r.success);
		});
	}
};

exports.delApi = function(req,res){
	 callApi(req, res, 'del', true, false, function(){
		(r.error)? res.send(r.error) : res.json(r.success);
	 });
};

exports.getDetailApi = function(req,res){
	var action = req.params.action,
		id = req.params.id,
		timer = setInterval ( onComplete, 100 ),
		i = 0,
		content = {
			id			: 'detail|' + action +'|'+id,
			originUId 	: action +'|'+id,

			// default values to populate with content and pass back. Error is no content exists
			error		: false,	
			author		: false,
			title		: false,
			channels	: false,
			events 		: false,
			articles 	: false
		};
	
	// get Channel
	req.url = '/channel/'+id;
	callApi(req, res, 'get', false, false, function(r){
		if( (r.success && r.success.count === 0) || !r.success ) {
			content.error = true;
		} else {
			content.author = r.success.resultset.channels[0];
			content.title = r.success.resultset.channels[0].name;
		}
	});
	
	
	// get related channels
	req.url = '/channel?'+action+'='+id;
	callApi(req, res, 'get', false, false, function(r){
		content.channels = (r.success)? r.success.resultset.channels : false;
	});

	// get related events
	req.url = '/event?'+action+'='+id;
	callApi(req, res, 'get', false, false, function(r){
		content.events = (r.success)? r.success.resultset.events : false;
	});

	// get related articles
	req.url = '/article?'+action+'='+id + '&limit=30';
	callApi(req, res, 'get', false, false, function(r){
		content.articles = (r.success)? r.success.resultset.articles : false;
	});
	
	function onComplete(){
		if( content.error || (content.channels && content.events && content.articles && content.author) ){
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

exports.tweet = function(req,res){
	if(!req.xhr) return;
	
	var url = 'http://api.twitter.com/1/statuses/update.json',
		obj = {
			token: {
				oauth_token_secret: req.session.auth.twitter.accessTokenSecret,
				oauth_token: req.session.auth.twitter.accessToken
			},
			wrap_links : true,
			status : req.body.message
		};

	console.log(req.session.auth.twitter)

	rest.post(url,obj).on('complete', function(data) {
		console.log(data);
		res.json(err)
	}).on('error', function(err){
		console.error(err);
		res.json(err)
	});

	//encodeURIComponent()
	/*

twitterClient.apiCall('POST', '/statuses/update.json',
    {token: 
    	{
    		oauth_token_secret: req.param('oauth_token_secret'), 
    		oauth_token: req.param('oauth_token')
    	}, 
    	status: req.param('message')
    	},
    

	rest.post(url,obj).on('complete', function(data) {
		console.log(data);
		//response.success = data;
		//callback(response);
	}).on('error', function(err){
		console.error(err);
		//response.error = 'error calling API';
		//callback(response);
	});
	*/
}

exports.cms = function(req,res){
	if(process.env.NODE_ENV === 'development' || (req.loggedIn && req.user.admin === '1') ){
		res.render('pages/cms', { title: 'Add Content', cssPath: '.cms', jsPath:'.cms' });
	} else {
		res.redirect('/', 401);
	}
}






