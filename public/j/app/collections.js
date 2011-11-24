var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Collections

(function(BB){

	var _Lists = Backbone.Collection.extend({
		// overiden in extended objects
		defaultUrl:'', 
		
		// extend to look for proper urls based on routing
		url: function(){
			return this.defaultUrl;
		}
	});
	
	var ChannelList = _Lists.extend({
		model : BB.Channel,
		defaultUrl: (on.env.internetConnection)? ( on.path.api + '/channel' ) : '/stubs/api.channel.js',
		parse: function(resp, xhr) {
			return resp.resultset.channels;
		}
    });
	
	var EventList = _Lists.extend({
		model : BB.Event,
		defaultUrl: (on.env.internetConnection)? ( on.path.api + '/event' ) : '/stubs/api.event.js',
		parse: function(resp, xhr) {
			return resp.resultset.events;
		}
	});
		
	var ArticleList = Backbone.Collection.extend({
		model : BB.Article,
		oldurl : function(opts){
			var twitterUsername = false,
				blockTerms = false,
				searchTerms = opts.keywords.replace(' ','+').replace(',','%2c');
				url = 'http://pipes.yahoo.com/pipes/pipe.run?';
				
			//if(blockTerms) url += 'BlockTerm%28s%29='+blockTerms+'&';
			if(searchTerms) url += '&SearchFor='+searchTerms+'&';
			//if(twitterUsername) url += '&Twittername=' +twitterUsername+ '.rss&';
			url += '_id=b9b673bf19353ce78c8912180c1b414e&_render=json';
	
			return url;
		},
		
		url: on.path.api + '/article',

		parse: function(resp, xhr) {
			return resp.resultset.articles;
		},
		comparator : function(Article) {
			// var P = Article.get("publish"),
				// D = new Date(P.replace(' ', 'T'));
			// return - D.getTime();
		}
	});

	var DetailList = Backbone.Collection.extend({
		model: BB.Detail,
		comparator: function(){
			// sort models.. by the users default order if available?
		},
		initialize: function(){
			_.bindAll(this, 'manageCollection', 'create');
			this.bind('add', this.manageCollection);
		},
		manageCollection: function(){
			// possibly delete old if too many - manage memory
			// console.log(this)
		},
		createModel: function(service, obj, DUID){
			console.info('# Collection.DetailList.create - ' + DUID)
			var cleanService;
			
			switch (service.toLowerCase()){
				case 'channel':
				case 'event':
					var jsonObj = obj.clone().toJSON(),
						channelList = new ChannelList(),
						eventList = new EventList(),
						articleList = new ArticleList();

					channelList.url = on.path.api + '/channel?' + service + '=' + jsonObj.id;
					eventList.url = on.path.api + '/event?' + service + '=' + jsonObj.id;
					articleList.url = on.path.api + '/article?' + service + '=' + jsonObj.id;

					var thisModel = {
						id		 	: DUID,				// to prevent clashes between channels & events with the same ID
						originId	: jsonObj.id,			// id reference of the original channel or event needed for urls on children
						service 	: service,
						title 		: jsonObj.name,
						selected	: true,
						channels 	: channelList,
						events 		: eventList,
						articles 	: articleList
					};
					
					_.extend(obj, thisModel);
					this.add(thisModel);
					return thisModel;

					break;
				case 'search':
					var thisModel = {
						id				: DUID,
						service 		: service,
						type	 		: obj.get('type'),
						title 			: obj.escape('title'),
						selected		: true,
						channels 		: new ChannelList(),
						channelJson		: obj.get('channels'),
						events 			: new EventList(),
						eventJson		: obj.get('events'),
						articles 		: new ArticleList(),
						articleJson		: obj.get('articles')
					};
					this.add(thisModel);
					return thisModel;
					
					break;
				default:
					console.error('# Collection.DetailList.Create: unknown service = ' + service);
					return;	
				
			}
		}
	});
	
	var CommentList = Backbone.Collection.extend({
		model : BB.Comment,
	
		url : function(opts){
			return on.path.api + '/comment' + this.urlParams;
		},
		urlParams: '', // eg. ?channel=id
		
		parse: function(resp, xhr){
			return resp.resultset.comments;
		},
		comparator : function(Comment) {
			//return Comment.get("created_at");
		}
	});
	var ChatList = Backbone.Collection.extend({});


	// Assign to BB namespace
	BB.ChannelList = ChannelList;
	BB.EventList = EventList;
	BB.DetailList = DetailList;
	BB.ArticleList = ArticleList;
	BB.CommentList = CommentList;
	BB.ChatList = ChatList;
	
})(this.BB);
