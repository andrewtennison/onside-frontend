/*
 * GET home page.
 */
var rest 		= require('restler');
	Config 		= require('../lib/conf'),
	conf 		= new Config();



var preload = function(req, path, callback){
	// remove this return - for test purposes until fixed
	//return '';
	
	var content = {},
		i = 0,
		timer = setInterval ( onComplete, 100 );
		user = (req.user)? '?user=' + req.user.id : '';

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
	console.log(conf.apiPath + '/channel' + user)
	rest.get(conf.apiPath + '/channel' + user)
		.on('success', function(data) {
			var channels = data.resultset.channels,
				l = channels.length,
				ii = 0,
				j = 0;		// tracks how many callbacks complete as dont execute in order
				
			if(l >= 1){
				for(ii; ii < l; ii++){
					
					getFirstArticle(channels[ii], ii, l, function(req){
						console.log('req >>>>>>>>>>>>>>>>' + j +' / ' + (l-1) + ' / ' + req.index);
						
						channels[req.index].defaultArticle = req.defaultArticle;
						
						j += 1;
						
						if(j === l ){
							content.channels = JSON.stringify(channels);
							console.log('>>>>>>> COMPLETE >>>>>>>>>>>>')
							content.channelsLoaded = true;
						}else{
							console.log('>>>>>>> FALSE >>>>>>>>>>>>')
							content.channelsLoaded = false;
						}
					});
				};
			}else{
				content.loadChannels = true;
				return content.channels = false;
			}
		})
		.on('error', function() { return content.channels = undefined});

	// get events
	console.log(conf.apiPath + '/event' + user)
	rest.get(conf.apiPath + '/event' + user)
		.on('success', function(data) { content.events = (data.resultset.events.length >= 1)? JSON.stringify(data.resultset.events) : false })
		.on('error', function() { content.events = undefined})
		.on('complete', function(){ content.eventsLoaded = true });

	// get searches if user exist
	console.log(conf.apiPath + '/search/list' + user)
	if(req.user) {
		rest.get(conf.apiPath + '/search/list' + user)
			.on('success', function(data) { return content.searches = (data.resultset.searches.length >= 1)? JSON.stringify(data.resultset.searches) : false })
			.on('error', function() { return content.channels = undefined})
			.on('complete', function(){ content.searchesLoaded = true });
	}
	
	function onComplete(){
		if(content.channelsLoaded && content.eventsLoaded && content.searchesLoaded){
			clearInterval( timer );
			callback(content);
		} else if(i === 3000){
			console.log('API timed out, timer = ' + i)
			clearInterval( timer );
			callback(content);
		} else{
			i += 100;
			console.log('proloading content from API, timer = ' + i)
		}
	}
	
};

exports.index = function(req, res){
	console.log('routes.index, if user enabled + logged in, req.user = ');
	console.log(req.user);

	if(req.loggedIn && req.user.enabled === '1'){
		preload(req, '', function(content){
			res.render('index', {
				title: 'Onside', 
				cssPath: '',
				jsPath:'',
				channels: content.channels, 
				events: content.events,
				searches: content.searches
			});
		});
		
	} else if(req.loggedIn && req.user.enabled === '0'){
		res.render('betaSignup', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:true })
	} else {
		res.render('betaSignup', { title: 'Onside', cssPath: '.signup', jsPath:'.signup', loggedIn:false })
	}
};

exports.demo1 = function(req, res){
  res.render('demo1', { title: 'Onside', cssPath: '.demo1', jsPath:'' })
};

exports.demo2 = function(req, res){
  res.render('demo1', { title: 'Onside', cssPath: '.demo2', jsPath:'' })
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
	if(process.env.NODE_ENV === 'development' || (req.loggedIn && req.user.admin === '1') ){
		res.render('addcontent', { title: 'Add Content', cssPath: '.cms', jsPath:'.cms' });
	} else {
		res.redirect('/', 401);
	}
}