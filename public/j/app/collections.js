var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Collections

(function(BB){

	var _Lists = Backbone.Collection.extend({
		// overiden in extended objects
		defaultUrl:'', 
	});
	
	var ChannelList = _Lists.extend({
		model : BB.Channel,
		url: on.path.api + '/channel',
		parse: function(resp, xhr) {
			return resp.resultset.channels;
		}
    });

	var EventList = _Lists.extend({
		model : BB.Event,
		url: on.path.api + '/event',
		parse: function(resp, xhr) {
			return resp.resultset.events;
		}
	});
		
	var ArticleList = Backbone.Collection.extend({
		model : BB.Article,
		url: on.path.api + '/article',
		parse: function(resp, xhr) {
			return resp.resultset.articles;
		},
		comparator : function(Article) {
			var P = Article.get("publish"),
				D = new Date(P.replace(' ', 'T'));
			return - D.getTime();
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
			console.info(obj)
			
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
						articles 	: articleList,
						getContent	: function(){
							thisModel.events.fetch();
							thisModel.channels.fetch();
							thisModel.articles.fetch();
						}
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
						//channelJson		: obj.get('channels'),
						events 			: new EventList(),
						//eventJson		: obj.get('events'),
						articles 		: new ArticleList(),
						//articleJson		: obj.get('articles'),
						getContent		: function(){
							thisModel.events.reset(obj.get('events'));
							thisModel.channels.reset(obj.get('channels'));
							thisModel.articles.reset(obj.get('articles'));
						}
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
