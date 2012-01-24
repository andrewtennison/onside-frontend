/*
 * GET home page.
 */
var rest 		= require('restler'),
	Config 		= require('../lib/conf'),
	conf 		= new Config(),
	twitter		= require('ntwitter');


// Base object for checkAuth function
baseAuthObject = {
	pass	: function(res, loggedIn, content){ res.render('pages/1.0_app.v0.1.ejs', { title: 'Onside', cssPath: '.app-0.1', jsPath:'', loggedIn:loggedIn, data: { channels: content.channels, events	: content.events,  searches: content.searches, popular: content.popularChannels } })}, 
	fail	: function(res, loggedIn){ res.render('pages/0.0_signup.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:loggedIn }) },
	reject	: function(res){  res.render('pages/0.1_signup_suspended.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:req.loggedIn }); },
	preload	: true,
	authReq	: true
	// other options = ,stage1:function(){}, stage2:function(){}, stage3:function(){}, stage4:function(){}, stage5:function(){}, stage6:function(){}, stage7:function(){}, stage8:function(){}
};

exports.index = function(req, res){
	req.session.redirectTo = req.url;
	
	var obj = { req : req, res : res };
	_.defaults(obj, baseAuthObject);
	checkAuth( obj );
};

exports.enter = function(req, res){
	var obj = {
		req		: req,
		res		: res,
		fail	: function(res, loggedIn){ res.render('pages/0.2_signup_enter.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:req.loggedIn }) }
	};
	_.defaults(obj, baseAuthObject);
	checkAuth( obj );
};

exports.exit = function(req, res){
	req.logout();
	res.render('pages/0.3_signup_exit.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:req.loggedIn });
};

exports.cms = function(req,res){
	if(!req.loggedIn){
		res.redirect('/');
	}else if(process.env.NODE_ENV === 'development' || (req.loggedIn && req.user.admin === '1') ){
		res.render('pages/cms.jade', { title: 'Add Content', cssPath: '.cms', jsPath:'.cms' });
	} else {
		res.redirect('/', 401);
	}
}



/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
/* API Proxy routes */
/* ////////////////////////////////////////////////////////////////////////////////////////////////// */

exports.getApi = function(req,res){
	var userReq = false;
	if( ((/myChannel/gi).test(req.url)) ) {
		userReq = true;
		req.url = req.url.replace('mychannel','channel');
	}
	callApi(req, res, 'get', false, userReq, function(r){
		(r.error)? res.send(r.error) : res.json(r.success);
	});
};

exports.postApi = function(req,res){
	var authReq = ((/(\/follow|\/unfollow|\/search\/save)/gi).test(req.url));
	callApi(req, res, 'post', authReq, false, function(r){
		(r.error)? res.send(r.error) : res.json(r.success);
	});
};

exports.delApi = function(req,res){
	callApi(req, res, 'del', true, false, function(){
		(r.error)? res.send(r.error) : res.json(r.success);
	});
};

/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
/* Twitter Proxy */
/* ////////////////////////////////////////////////////////////////////////////////////////////////// */

exports.tweet = function(req,res){
	if(!req.xhr || !req.session.auth.twitter) return;
	
		
	var twit = new twitter({
		consumer_key: conf.twit.consumerKey,
		consumer_secret: conf.twit.consumerSecret,
		access_token_key: req.session.auth.twitter.accessToken,
		access_token_secret: req.session.auth.twitter.accessTokenSecret
	});
	
	twit.updateStatus(req.body.message,
		function (err, data) {
		console.log(console.dir(data));
		res.json(data)
	});
}

/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
/* Check user authentication */
/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
var checkAuth = function(opts){
	if(opts.req == undefined || opts.res == undefined) { console.log('routes.index.checkAuth - req/res not defined'); return; };

	var user = opts.req.user || {},
		res = opts.res,
		loggedIn = opts.req.loggedIn,
		stage = false,
		userStatus = false;

	// if auth needed - check for login + user.enabled property
	if(opts.authReq && (!loggedIn || user.enabled === '0') ) {
		opts.fail(res,loggedIn);
		return;
	};
	
	// user status - hack if auth not required
	userStatus = (!opts.authReq && user.status === 0)? '1' : user.status;
	
	// hack for admin accounts not setup properly
	if(user.enabled === '1' && user.admin === '1' && user.status === '0') userStatus = '2';

	// We can extend this property for different scenarios later
	switch(userStatus){
		case '0':						// default - user new, not yet invited
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
	
	// wont reach here on fail
	if(opts.preload){
		preload(opts.req, function(json){
			var content = {channels: json.channels, events: json.events, searches: json.searches, popularChannels: json.popularChannels};
			( opts[stage] )? opts[stage](res,loggedIn,content) : opts.pass(res,loggedIn,content);
		});
	}else{
		var content = {channels: false, events: false, searches: false, popularChannels: false};
		( opts[stage] )? opts[stage](res,content) : opts.pass(res,loggedIn,content);
	}
}

/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
/* API Call + grouped calls to API */
/* ////////////////////////////////////////////////////////////////////////////////////////////////// */

function callApi(req, res, action, authReq, userReq, callback){
	var response = {};
	
	if(authReq && !req.loggedIn){
		response.error = 'User must be logged in to perform this action';
		console.err('user must be auth')
		callback(response);
		return;
	};
	
	if(req.xhr){
		var path = req.url.replace('/api',''),
			url = conf.apiPath,
			token = req.session.onsideToken || false,
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
				if(req.loggedIn && userReq) obj.data.user = UID;
				if(token) obj.data.token = token;

				break;
			case 'get':
				if(req.loggedIn && userReq) path += ((path.indexOf('?') === -1)? '?' : '&') + 'user=' + UID;
				if(token) path += ((path.indexOf('?') === -1)? '?' : '&') + 'token=' + token;
				break

			case 'del':
			default:
				console.log('API Call - do nothing with params or body');
				break;
		}
		url += path;
		
		console.log('callAPI - ' + action + ' to - ' + url);
		
		rest[action](url,obj).on('complete', function(data) {
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
	// req.url = '/channel?'+action+'='+id;
	// callApi(req, res, 'get', false, false, function(r){
		// content.channels = (r.success)? r.success.resultset.channels : false;
		content.channels = [];
	// });

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
		if( content.error || (/*content.channels &&*/ content.events && content.articles && content.author) ){
			clearInterval( timer );
			res.json(content)
		} else if(i === 3000){
			console.log('API timed out, timer = ' + i)
			clearInterval( timer );
			res.send('load detailed failed, request timed out')
		} else{
			i += 100;
			console.log('load detail content from API, timer = ' + i)
		}
	}

};


var preload = function(req, callback){
	var content = {},
		i = 0,
		timer = setInterval ( onComplete, 100 ),
		user = req.user,
		userString = (user)? 'user=' + user.id : false,
		popularUserString = 'user=1',
		token = (req.session.onsideToken)? req.session.onsideToken : false;
		
	var buildUrl = function(path, userParam){
		var p = conf.apiPath + path;
		if(token) p += '?token=' + token;
		if(userParam) p += '&' + userParam;
		return p;
	}	
	
	var getFirstArticle = function( channel, index, length, callback ){
		var url = buildUrl('/article?channel='+channel.id+'&limit=1', false),
			req = {index:index};
		
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

	function getNestedInfo(path, service, serviceLoad, serviceName){
		rest
		.get(path)
		.on('success', function(data) { 
			var list = data.resultset[service],
				l = list.length,
				ii = 0,
				j = 0;		// tracks how many callbacks complete as dont execute in order
				
			if(l === 0 || list === undefined){
				content[serviceLoad] = true;
				content[ ((serviceName)? serviceName : service) ] = '[]';				
			}else{
				for(ii; ii < l; ii++){
					getFirstArticle(list[ii], ii, l, function(req){
						list[req.index].defaultArticle = req.defaultArticle;
						j += 1;
						if( j === l ){
							console.log('Preload of article for each channel complete')
							content[serviceLoad] = true;
							content[ ((serviceName)? serviceName : service) ] = JSON.stringify(list);
						}else{
							content[serviceLoad] = false;
						}
					});
				};
			}

		})
		.on('error', function() { 
			content[service] = false;
			content[serviceLoaded] = true;
		});
	};

	function getInfo(path, service, serviceLoaded){
		if(!userString) {
			content[service] = false;
			content[serviceLoaded] = true;
			return;
		};
		
		rest
		.get(path)
		.on('success', function(data) { content[service] = (data.resultset[service].length >= 1)? JSON.stringify(data.resultset[service]) : '[]' })
		.on('error', function() { content[service] = false})
		.on('complete', function(){ content[serviceLoaded] = true });
	};
		
	// get single level content
	getInfo(buildUrl('/event', userString), 'events', 'eventsLoaded');
	getInfo(buildUrl('/search/list', userString), 'searches', 'searchesLoaded');
	
	// get nested content
	getNestedInfo(buildUrl('/channel', userString), 'channels', 'channelsLoaded');
	getNestedInfo(buildUrl('/channel', popularUserString), 'channels', 'popularChannelsLoaded', 'popularChannels');

	function onComplete(){
		if(content.channelsLoaded && content.eventsLoaded && content.searchesLoaded && content.popularChannelsLoaded){
			console.log('Preloading complete')
			clearInterval( timer );
			callback(content);
		} else if(i === 3000){
			console.log('API timed out, timer = ' + i)
			clearInterval( timer );
			callback(content);
		} else{
			i += 100;
			console.log('proloading content from API, timer = ' + i + '// channel-'+ content.channelsLoaded +' // event-'+ content.eventsLoaded +' // search-'+ content.searchesLoaded +' // popular-'+ content.popularChannelsLoaded)
		}
	}
};





