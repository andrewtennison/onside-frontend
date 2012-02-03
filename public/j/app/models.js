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
			this.channels.params = {user:'me'};
			
			this.events = new BB.EventList();
			this.events.params = {user:'me'};
			
			this.searches = new BB.SavedSearchList();
			this.searches.params = {user:'me'};

			this.detailedList = new BB.DetailList();
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
			console.info('# Model.Channel.initialize');
			this.setImage();
			// var i = this.get('image');
			// if( i === 'null' || i === null || i.length === 0) this.set({image:'/i/placeholder/listIcon2.png'});
		},
		setImage: function(){
			var attr = this.attributes;
			console.log(attr.sport +' / '+attr.image);

			if(attr.sport && ( attr.image === 'null' || attr.image === '' )){
				var imagePath;
				switch(attr.sport){
					case 'golf':
						imagePath = '/i/content/channel/_golf.png';
						break;
					case 'football':
						imagePath = '/i/content/channel/_football.png'
						break;
					default:
						imagePath = this.defaults.image;
						break;
				};
				this.set({image:imagePath});
			}
		},
		parse: function(resp){
			//return resp.resultset.channels[0];
			return resp
		},
		defaults: {
			selected	: false,
			service		: 'channel',
			image		: '/i/placeholder/listIcon2.png',
			branding	: '#ffffff'
			
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
			//return resp.resultset.searches[0];
			return resp
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
		url: function(){
			return '/' + this.id.replace(/\|/g,'/');
		},
		defaults: {
			selected 	: true,
			title		: '',
			type		: 'default',
			image		: '/i/placeholder/listIcon2.png',
			saved		: false
		},
		refresh: function(){
			this.get('channels').reset(this.get('channelJson'));
			this.get('events').reset(this.get('eventJson'));
			this.get('articles').reset(this.get('articleJson'));
		},
		setSaved: function(app){},
		follow : function(){
			var t = this.get('type');
			switch(t){
				case 'channel':
					var id = this.get('author').id,
						val = (app.channels.get(id))? true : false;
					this.set({saved: val });
					break;
				case 'event':
					break;
				case 'search':
					break;
				case 'list':
				default:
					break;
			}
		}
	});
	var DetailChannel = Detail.extend({
		parse: function(attr){
			if(attr.image === undefined && (attr.author.image === 'null' || attr.author.image === '')){
				switch(attr.author.sport){
					case 'golf':
						attr.image = '/i/content/channel/_golf.png';
						break;
					case 'football':
						attr.image = '/i/content/channel/_football.png'
						break;
					default:
						attr.image === this.defaults.image
						break;
				};
			};
			return attr;
		},
		setSaved: function(app){
			var id = this.get('author').id,
				val = (app.channels.get(id))? true : false;
			this.set({saved: val });
		},
		follow : function(app){
			var self = this,
				saved = this.get('saved'),
				id = this.get('author').id,
				url = on.path.api + '/channel/';
			
			url += (saved)?	'unfollow' : 'follow';

			console.log(saved +' || '+url);
			$.post(url, {channel: id})
			.success(function(){
				self.set({saved: (!saved) });
				app.channels.fetch();
			}).error(function(res){
				console.error(res)
			});
		}
	});
	var DetailSearch = Detail.extend({
		initialize: function(){
			this.defaults.image = '/i/content/channel/_search.png';
		},
		follow: function(app){
			console.dir(this.attributes);
			var self = this,
				saved = this.get('saved'),
				url = on.path.api + '/search/',
				title = this.get('title');
			
			url += (saved)? 'save' : 'unsave';
			$.post(url, {query:title, name:title})
			.success(function(){
				self.set({saved:true});
				app.searches.fetch();
			})
			.error(function(res){
				console.error(res)
			});
			
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
			//return resp.resultset.comments[0];
			return resp;
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
	BB.DetailChannel = DetailChannel;
	BB.DetailSearch = DetailSearch;
	BB.Article = Article;
	BB.Comment = Comment;
	BB.Chat = Chat;
	BB.Tweet = Tweet;
	
	BB.Ev = Ev;
	
})(this.BB);
