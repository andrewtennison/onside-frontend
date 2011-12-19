var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	
	var App	= Backbone.Model.extend({
		initialize: function(route){
			on.helper.log('# Model.App.initialize','info');
			var app = this;
			this.route = route;
			
			_.bindAll(this, 'updateService');
			
			// create + init collections for channels + events
			this.channels = new BB.ChannelList();
			this.events = new BB.EventList();
			this.detailedList = new BB.DetailList(app);
			this.comments = new BB.CommentList(app);
			this.searches = new BB.SavedSearchList(app);
			
			this.bind('change:selectedItemUID', this.updateService);
		},
		defaults: {
			selectedServiceName: null,
			selectedItemUID: null,
			searchModel: null,
			selectedArticleList: null,
			selectedArticle: null
		},
		updateService: function(){
			this.set({
				selectedServiceName: this.get('selectedItemUID').split('|')[0]
			}) 
		}
	});

	var Channel = Backbone.Model.extend({
		url: function(){
			return on.path.api + '/channel/' + this.id;
		},
		service: 'channel',
		initialize: function(){
			on.helper.log('# Model.Channel.initialize','info');
		},
		parse: function(resp){
			return resp.resultset.channels[0];
		},
		defaults: {
			selected	: false,
			service		: 'channel',
			img			: '/i/placeholder/listIcon2.png'
			
		// DB model structure
			// id 				: undefined,
			// name 			: undefined,
			// description 	: undefined,
			// // type 			: undefined, duplicate - is mine used, if so rename mine
			// sport 			: undefined,
			// level 			: undefined,
			// geolat 			: null,
			// geolng 			: null
		}
	});
	
	var Event = Backbone.Model.extend({
		service: 'events',
		initialize: function(){
			on.helper.log('# Model.Event.initialize','info');
		},
		defaults: {
			selected	: false,
			service		: 'event',
			img			: '/i/placeholder/listIcon2.png'

		// DB model structure
			// service 			: undefined,
			// sport			: undefined,
			// type 			: undefined,
			// geolat			: null,
			// geolng			: null			
		}
	});

	var SavedSearch = Backbone.Model.extend({
		url: function(){
			//return on.path.api + '/search/save' + this.id;
		},
		service: 'search',
		initialize: function(){
			on.helper.log('# Model.SavedSearch.initialize','info');
		},
		parse: function(resp){
			return resp.resultset.searches[0];
		},
		defaults: {
			selected	: false,
			service		: 'search',
			name		: null,
			query		: null			
		}
	});
	
	var Search = Backbone.Model.extend({
		url: function(){
			return on.path.api + '/search?q=' + this.query;
		},
		query: '',
		service: 'search',
		parse: function(resp){
			return {
				id			: this.query.replace(' ', '_'),
				service		: resp.service,
				title		: this.query,
				channels	: resp.resultset.channels,
				events		: resp.resultset.events,
				articles	: resp.resultset.articles,
			};
		},
		initialize: function(){
			on.helper.log('# Model.Search.initialize','info');
		}
	})
	
	var Detail = Backbone.Model.extend({
		initialize: function(){
			// this.channels = new BB.ChannelList();
			// this.events = new BB.EventList();
			// this.articles = new BB.ArticleList();

		},
		defaults: {
			selected 	: false,
			saved 		: false,
			originUId	: null,
			channels	: null,
			events 		: null,
			articles 	: null
		},
		getContent: function(){
			var service = this.get('originUId').split('|')[0];
			switch(service){
				case 'channel':
				case 'event':
					this.setPaths();
					this.get('events').fetch();
					this.get('channels').fetch();
					this.get('articles').fetch();
					break;
				case 'search':
					this.get('events').reset(this.get('eventJson'));
					this.get('channels').reset(this.get('channelJson'));
					this.get('articles').reset(this.get('articleJson').slice(0, on.env.articleMax));
					break;
				default:
					on.helper.log('Model.Detail.getContent - service = ' + service, 'error');
			}
		},
		setPaths: function(){
			var s = this.get('originUId').split('|');
			this.get('channels').url = on.path.api + '/channel?' + s[0] + '=' + s[1];
			this.get('events').url = on.path.api + '/event?' + s[0] + '=' + s[1];
			this.get('articles').url = on.path.api + '/article?' + s[0] + '=' + s[1] +'&limit='+on.env.articleMax;
		}
	});

	var Article = Backbone.Model.extend({
		initialize: function(){
			//on.helper.log('# Model.Article.initialize', 'info');
		},
		defaults: {
			selected : false,
			filtered : true
		}

	});
	
	var Comment = Backbone.Model.extend({
		initialize: function(){
			//on.helper.log('# Model.Comment.initialize','info');
		},
		parse: function(resp, xhr){
			return resp.resultset.comments[0];
		},
		defaults: {
			service	: 'comment',
			//id		: null,
			// article	: null,
			// channel 	: null,
			// event	: null,
			// user 	: null,
			// reply	: null,
			// comment 	: null,
			// added 	: null
		}
		
		
	});
	
	var Chat = Backbone.Model.extend({
		initialize: function(){
			on.helper.log('# Model.Chat.initialize','info');
		}
	});
	
	
	// extend events for custom scenarios
	var Ev = {};
	Ev.footballMatch = Event.extend({});
	
	BB.App = App;
	BB.Channel = Channel;
	BB.Event = Event;
	BB.SavedSearch = SavedSearch;
	BB.Search = Search;
	BB.Detail = Detail;
	BB.Article = Article;
	BB.Comment = Comment;
	BB.Chat = Chat;
	
	BB.Ev = Ev;
	
})(this.BB);
