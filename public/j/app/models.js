var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	
	var App	= Backbone.Model.extend({
		initialize: function(route){
			on.helper.log('# Model.App.initialize','info');
			var app = this;
			this.route = route;
			
			_.bindAll(this, 'updateService', 'setTitle');
			
			// create + init collections for channels + events
			this.channels = new BB.ChannelList();
			this.events = new BB.EventList();
			this.detailedList = new BB.DetailList(false,app);
			this.searches = new BB.SavedSearchList();
			this.comments = new BB.CommentList(false,app);
			this.tweets = new BB.TweetList(false,app);
			
			this.bind('change:selectedItemUID', this.updateService);
			this.bind('change:selectedArticle', this.updateService);
			
		},
		defaults: {
			selectedServiceName: null,
			selectedItemUID: null,
			selectedItemTitle: null,
			searchModel: null,
			selectedArticleList: null,
			selectedArticle: null
		},
		setTitle: function(){
			var title, model,
				UID = this.get('selectedItemUID'),
				article = this.get('selectedArticle');
			
			if(article){
				model = this.get('selectedArticleList').get(article);
			}else if(UID.split('|')[1] !== null){
				model = this.detailedList.get('detail|' + UID);
			} else {
				model = false;
			}

			title = (model)? ( model.get('name') || model.get('title') ) : 'Onside home';
			this.set({selectedItemTitle : title})
		},
		updateService: function(model,val){
			this.set({
				selectedServiceName	: this.get('selectedItemUID').split('|')[0]
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
			var i = this.get('image');
			if( i === 'null' || i === null || i.length === 0) this.set({image:'/i/placeholder/listIcon2.png'});
		},
		parse: function(resp){
			return resp.resultset.channels[0];
		},
		defaults: {
			selected	: false,
			service		: 'channel',
			image		: '/i/placeholder/listIcon2.png'
			
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
			_.bindAll(this, 'setImage' );
			this.bind('change', this.setImage)
		},
		setImage: function(){
			var a = this.get('author');
			if(a){
				if( a.image === 'null' || a.image === null || a.image.length === 0) a.image = '/i/placeholder/listIcon2.png';
				this.set({image:a.image});
			}
		},
		url: function(){
			return '/' + this.id.replace(/\|/g,'/');
		},
		defaults: {
			selected 	: true,
			type		: 'default',
			image		: '/i/placeholder/listIcon2.png'
			// saved 		: false,
		},
		refresh: function(){
			this.get('channels').reset(this.get('channelJson'));
			this.get('events').reset(this.get('eventJson'));
			this.get('articles').reset(this.get('articleJson'));
		},
		validate: function(attrs) {
			// if (attrs.error) {
				// return "channel does not exist";
			// }
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
	
	var Tweet = Backbone.Model.extend({
		url: '/tweet'
		/*
		methodToURL: {
			'read': 'http://search.twitter.com/search.json?q=%23' + this.hash + '&callback=?',
			'update': 'http://search.twitter.com/search.json?q=%23' + this.hash + '&callback=?',
			'create': '/tweet'
		},

		sync: function(method, model, options) {
//			if(method === 'read' && !this.hash) return;
			options = options || {};
			options.url = model.methodToURL[method.toLowerCase()];
			Backbone.sync(method, model, options);
		}
		*/
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
	BB.Tweet = Tweet;
	
	BB.Ev = Ev;
	
})(this.BB);
