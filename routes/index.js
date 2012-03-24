/*
 * GET home page.
 */
var rest		= require('restler'),
	Config		= require('../lib/conf'),
	conf		= new Config(),
	Adverts		= require('../lib/adverts'),
	twitter		= require('ntwitter');


// Base object for checkAuth function
baseAuthObject = {
	pass	: function(res, content){ res.render('pages/1.0_app.v0.1.ejs', { title: 'Onside', cssPath: '.app-0.1', jsPath:'', data: { channels: content.channels, events : content.events,  searches: content.searches, popular: content.popularChannels } })},
	notAuthorized	: function(res){ res.statusCode = 401; res.end('Not authorized'); },
	notAuthenticated: function(req, res) { req.session.redirectTo = req.url; res.redirect('/signup') },
	reject	: function(res){  res.render('pages/0.1_signup_suspended.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup'}); },
	preload	: false,
	authReq	: true,
	admin   : false
	// other options = ,stage1:function(){}, stage2:function(){}, stage3:function(){}, stage4:function(){}, stage5:function(){}, stage6:function(){}, stage7:function(){}, stage8:function(){}
};

exports.index = function(req, res){
	req.log.push('######### route.index');
	var obj = { req : req, res : res, notAuthorized	: function(res){ res.redirect('/signup'); } };
	_.defaults(obj, baseAuthObject);
	checkAuth( obj );
};

exports.exit = function(req, res){
	req.logout();
	res.render('pages/0.3_signup_exit.ejs', { title: 'Onside', cssPath: '.signup', jsPath:'.signup'});
};

exports.cms = function(req,res){
	var obj = {
		req: req,
		res: res,
		pass: function(res, content){ res.render('pages/cms.ejs', { title: 'CMS', cssPath: '.cms', jsPath:'.cms' })},
		notAuthenticated: function(req, res){ req.session.redirectTo = req.url; res.redirect('/enter') },
		preload:false,
		admin:true
	};
	_.defaults(obj, baseAuthObject);
	checkAuth( obj );
};



/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
/* API Proxy routes */
/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
exports.getApi = function(req,res){
	req.log.push('######### route.getAPI');
	req.log.startTimer('ApiGet');

	var userReq = false;
	if( ((/myChannel/gi).test(req.url)) ) {
		userReq = true;
		req.url = req.url.replace('mychannel','channel');
	};
	callApi(req, res, 'get', false, userReq, function(r){
		req.log.endApiGet('API.get Complete, url='+req.url);
		(r.error)? res.send(r.error) : res.json(r.success);
	});
};

exports.postApi = function(req,res){
	req.log.push('######### route.postAPI');
	req.log.startTimer('ApiPost');
	var authReq = ((/(\/follow|\/unfollow|\/search\/save|\/search\/list)/gi).test(req.url));
	callApi(req, res, 'post', authReq, true, function(r){
		req.log.endApiPost('API.post Complete, url='+req.url);
		(r.error)? res.send(r.error) : res.json(r.success);
	});
};

exports.delApi = function(req,res){
	req.log.startTimer('ApiDel');
	callApi(req, res, 'del', true, false, function(r){
		req.log.endApiDel('API.del Complete, url='+req.url);
		(r.error)? res.send(r.error) : res.json(r.success);
	});
};

/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
/* Twitter Proxy */
/* ////////////////////////////////////////////////////////////////////////////////////////////////// */

exports.postTweet = function(req,res){
	req.log.startTimer('TweetPost');
	if(!req.xhr || !req.session.auth.twitter) return;
	var twit = new twitter({
		consumer_key: conf.twit.consumerKey,
		consumer_secret: conf.twit.consumerSecret,
		access_token_key: req.session.auth.twitter.accessToken,
		access_token_secret: req.session.auth.twitter.accessTokenSecret
	});
	twit.updateStatus(req.body.message, function (err, data) {
		req.log.endTweetPost('Teet.post Complete, url='+req.body.message);
		if(err){
			res.json(err)
		}else{
			res.json(data)
		}
	});
};
exports.getTweet = function(req,res){
	req.log.startTimer('TweetGet');
	if(!req.xhr) return;
	var twit = new twitter({
		consumer_key: conf.twit.consumerKey,
		consumer_secret: conf.twit.consumerSecret,
		access_token_key: conf.twit.accessToken,
		access_token_secret: conf.twit.accessSecret
	});
	var hash = '#' + req.url.replace('/tweet/','');
	twit.search(hash, function(err, data) {
		req.log.endTweetGet('Teet.get Complete, url='+hash);
		res.json(data);
    });
};



/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
/* Check user authentication */
/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
var checkAuth = function(opts){	
	if(opts.req == undefined || opts.res == undefined) { console.log('routes.index.checkAuth - req/res not defined'); return; };

	var bypassAuth = opts.req.param('bypassauth'),
		user = opts.req.user || {},
		res = opts.res,
		loggedIn = opts.req.loggedIn,
		stage = false,
		userStatus = false;

	// bypass authentication - here for load testing secure pages.
	if((bypassAuth === conf.bypassAuthKey) && !loggedIn){
		loggedIn = true;
		user.enabled = 1;
		user.admin = 1;
		user.status = '1';
		opts.req.session.bypassAuth = true;
	}
	
	// if auth needed - check for login + user.enabled property
	if(opts.authReq) {
		if (!loggedIn ) return opts.notAuthenticated(opts.req, res);
		if ( user.enabled == 0 || (opts.admin && user.admin != 1) ) return opts.notAuthorized(res);
	}

	// user status - hack if auth not required
	userStatus = (!opts.authReq && user.status === 0)? '1' : user.status;

	// We can extend this property for different scenarios later
	switch(userStatus){
		case '0':						// default - user new, not yet invited
			//opts.notAuthorized(res);
			//return;
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
			opts.reject(res);
			return;

		default:
			console.log('routes.checkAuth - user.enabled unknow =' + userStatus)
			opts.notAuthenticated(opts.req, res);
			return;
	};

	// wont reach here on fail
	if(opts.preload){
		preload(opts.req, function(json){
			var content = {channels: json.channels, events: json.events, searches: json.searches, popularChannels: json.popularChannels};
			( opts[stage] )? opts[stage](res,content) : opts.pass(res,content);
		});
	}else{
		var content = {channels: false, events: false, searches: false, popularChannels: false };
		( opts[stage] )? opts[stage](res,content) : opts.pass(res,content);
	}
}

/* ////////////////////////////////////////////////////////////////////////////////////////////////// */
/* API Call + grouped calls to API */
/* ////////////////////////////////////////////////////////////////////////////////////////////////// */

function callApi(req, res, action, authReq, userReq, callback){
	var response = {},
		loggedIn = req.loggedIn,
		user = req.user,
		UID = false;

	// bypass authentication - here for load testing secure pages.
	if(req.session.bypassAuth && !loggedIn){
		loggedIn = true;
		user = {id: '1'};
		UID = 1;
	}

	if(authReq && !loggedIn){
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

		if(loggedIn && !UID) UID = req.user.id;

		if(path.indexOf('user=me') !== -1) {
			if(!UID) {
				response.error = 'User must be logged in to perform this action';
				callback(response);
				return;
			}
			path = path.replace('user=me','user='+UID);
		}

		switch(action){
			case 'post':
				obj.data = req.body;
				if(loggedIn && userReq) obj.data.user = UID;
				if(token) obj.data.token = token;

				break;
			case 'get':
				if(loggedIn && userReq) path += ((path.indexOf('?') === -1)? '?' : '&') + 'user=' + UID;
				if(token) path += ((path.indexOf('?') === -1)? '?' : '&') + 'token=' + token;
				break

			case 'del':
			default:
				console.log('API Call - do nothing with params or body');
				break;
		}
		url += path;

		console.log('# call api: action='+action + ' & url=' + url.replace(token,'token123'))

		rest[action](url,obj).on('complete', function(data) {
			console.log('API Call complete');
		}).on('success', function(data){
			if(data.resultset && data.resultset.users && (data.resultset.users[0].id === req.session.user.id) ){
				console.log('update session')
				console.log(data.resultset.users[0] )
			//if( (/\/user\//gi).test(url) && req.session.user && data.resultset.users[0] ){
				req.session.user = data.resultset.users[0];
			}
			data.auth = loggedIn;
			response.success = data;
			callback(response);			
		}).on('error', function(err){
			response.error = 'error calling API';
			callback(response);
		});

	}else{
		res.redirect('/');
	}

};

exports.getDetailApi = function(req,res){
	req.log.startTimer('DetailGet');

	var action = req.params.action,
		id = req.params.id,
		timer = setInterval ( onComplete, 100 ),
		i = 0,
		required,
		content = {
			id			: 'detail|' + action +'|'+id,
			originUId 	: action +'|'+id,
			type		: action,

			// default values to populate with content and pass back. Error is no content exists
			error		: false,
			author		: false,
			title		: false,
			channels	: false,
			events 		: false,
			articles 	: false,
			channelArticles: false,
			adverts		: (Adverts[id])? Adverts[id] : false 
		};
		
	switch(action){
		case 'search':
			console.log('detail = search');
			required = ['events', 'channels', 'articles'];
			content.title = id;
			singleList(req, res, false, '/search?q='+id, function(c){
				if(!c) {
					content.error = true;
				} else {
					content.articleCount = c.articles.length;
					content.articles = c.articles.slice(0, 20);
					content.channels = c.channels;
					content.events = c.events;
				};
			});
			break;
		case 'channel':
			console.log('detail = channel')
			required = ['events', 'articles', 'author'];
			singleList(req, res, 'channels', '/channel/'+id, function(c){
				if(!c) {
					content.error = true;
				} else {
					content.author = c[0];
					content.title = content.author.name;
					if(content.author.image && content.author.image.length !== 0 && content.author.image !== 'null') content.image = content.author.image;
				};
			});
			singleList(req, res, 'events', '/event?'+action+'='+id, function(c){
				if(!c) content.error = true; else content.events = c;
			});
			singleList(req, res, 'articles', '/article?limit=10&'+action+'='+id, function(c){
				if(!c) content.error = true; else content.articles = c;
			});
			break;
		case 'event':
			console.log('detail = event')
			required = ['channels', 'articles', 'author'];
			singleList(req, res, 'events', '/event/'+id, function(c){
				if(!c) {
					content.error = true;
				} else {
					content.author = c[0];
					content.title = content.author.name
				};
			});
			singleList(req, res, 'channels', '/channel?'+action+'='+id, function(c){
				if(!c) content.error = true; else content.channels = c;
			});
			singleList(req, res, 'articles', '/article?limit=10&'+action+'='+id, function(c){
				if(!c) content.error = true; else content.articles = c;
			});
			break;
			
		case 'list':
			console.log('detail = list')
			required = ['channels', 'channelArticles'];
			
			var uid, url, articleCount;
			
			switch(id){
				case 'home':
					if(!req.loggedIn) {
						content.error = true;
						break;
					}
					totalArticles = (req.query.grouped)? req.query.grouped : -1;
					uid = req.user.id;
					break;
				case 'popular':
					uid = '1';
					break;
				case 'highlights':
					totalArticles = (req.query.grouped)? req.query.grouped : 20;
					break;
				default:
					content.error = true;
					break;
			};

			singleList(req, res, 'channels', '/channel?user='+uid, function(c){
				console.log('channels loaded');

				if(!c) {
					content.error = true;
				} else if( c.length == 0 ){
					content.channels = c;
					content.channelArticles = true;
				} else {
					var total = 0;
					content.channels = c;
					content.channels.forEach(function(channel,index){
						var count = (totalArticles == -1)? 1 : Math.ceil(totalArticles / content.channels.length);
						
						if(id == 'highlights'){
							content.articles = [];
							singleList(req, res, 'articles', '/article?limit='+count+'&channel='+channel.id, function(d){
								if(!d) {
									content.error = true;
								} else {
									d.forEach(function(article, index){
										article.channel = channel;
										content.articles.push( article );
									});
									channel.defaultArticle = false;										
									total += 1;
									if(total === content.channels.length) content.channelArticles = true;
								}
							});
						}else {
							channel.defaultArticle = [];
							singleList(req, res, 'articles', '/article?limit='+count+'&channel='+channel.id, function(d){
								if(!d) {
									content.error = true;
								} else {
									d.forEach(function(article, index){
										if(index == 0) channel.latestArticleDate = article.publish;
										channel.defaultArticle.push( article );
									});
									total += 1;
									if(total === content.channels.length) content.channelArticles = true;
								}
							});
						}
						// singleList(req, res, 'articles', '/article?limit=1&channel='+channel.id, function(d){
							// if(!d) {
								// content.error = true;
							// } else {
								// channel.defaultArticle = d[0] || false;
								// channel.latestArticleDate = (d[0])? d[0].publish : false;
								// total += 1;
								// if(total === content.channels.length) content.channelArticles = true;
							// }
						// });
					})// end  forEach
				};// end singleList
			});

			content.title = id;
			break;
		default:
			break;
	}


	function checkRequired(){
		var i = 0, l = required.length, complete = 0;
		for(i;i<l;i++){
			if(content[ required[i] ]) complete += 1;
		};
		var res = (complete === l)? true : false;
		return res;
	}

	function onComplete(){
		if( content && (content.error || checkRequired() ) ){
			clearInterval( timer );
			req.log.endDetailGet('Detail.get Complete, id='+content.id);
			res.json(content)
		} else if(i === 19000){
			clearInterval( timer );
			req.log.endDetailGet('Detail.get Failed, id='+content.id);
			res.json({ error: 'api timed out'});
		} else{
			i += 100;
			//console.log('load detail content from API, timer = ' + i)
		}
	}

};

// called by detail
function singleList(req, res, service, url, callback){
	req.url = url;
	callApi(req, res, 'get', false, false, function(r){
		var content = (r.success)? ( (!service)? r.success.resultset : r.success.resultset[service] ) : true;
		callback(content);
	});
};


// may not be used anymore...
var preload = function(req, callback){
	console.log('# PRELOAD');
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
		console.log('# /routes/index > preload.buildUrl: url='+ p.replace(token,'token123'));
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
							//console.log('Preload of article for each channel complete');
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
			console.log('/routes/index > Preloading complete, i = ' + i);
			clearInterval( timer );
			callback(content);
		} else if(i === 9000){
			console.log('/routes/index > API timed out, timer = ' + i);
			clearInterval( timer );
			callback(content);
		} else{
			i += 100;
			//console.log('proloading content from API, timer = ' + i + '// channel-'+ content.channelsLoaded +' // event-'+ content.eventsLoaded +' // search-'+ content.searchesLoaded +' // popular-'+ content.popularChannelsLoaded)
		}
	}
};





