var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	
	// For CORS / cross origin restriction
	var extendAjax = {
		beforeSend:function(xhr){
			// xhr.setRequestHeader('Origin', 'http://dev.onside.me')
			// xhr.setRequestHeader('Access-Control-Request-Method', 'POST,GET,DELETE');
			// xhr.setRequestHeader('Access-Control-Request-Headers','OnsideAuth')
			// xhr.setRequestHeader('OnsideAuth', '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b73648')
		}
	};

	var App	= Backbone.Model.extend({
		initialize: function(route){
			console.info('# Model.App.initialize');
			var app = this;
			this.route = route;
			
			_.bindAll(this, 'updateService');
			
			// create + init collections for channels + events
			this.channels = new BB.ChannelList();
			this.events = new BB.EventList();
			this.detailedList = new BB.DetailList(app);
			this.comments = new BB.CommentList(app);
			
			this.bind('change:selectedItemUID', this.updateService);
		},
		defaults: {
			selectedServiceName: null,
			selectedItemUID: null,
			searchModel: null
		},
		updateService: function(){
			this.set({
				selectedServiceName: this.get('selectedItemUID').split('|')[0]
			}) 
		}
	});

	var Channel = Backbone.Model.extend({
		service: 'channels',
		initialize: function(){
			console.info('# Model.Channel.initialize');
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
			console.info('# Model.Event.initialize');
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
	
	var Search = Backbone.Model.extend({
		service: 'search',
		initialize: function(){
			console.info('# Model.Search.initialize');
		}
	})
	
	var Detail = Backbone.Model.extend({
		// channels: null,
		// events: null,
		// articles: null,
		initialize: function(){
		},
		defaults: {
			selected: false,
			service: undefined,
			saved: false
		}
	});

	var Article = Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.Article.initialize');
		}
	});
	
	var Comment = Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.Comment.initialize');
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
			console.info('# Model.Chat.initialize');
		}
	});
	
	
	// extend events for custom scenarios
	var Ev = {};
	Ev.footballMatch = Event.extend({});
	
	BB.App = App;
	BB.Channel = Channel;
	BB.Event = Event;
	BB.Search = Search;
	BB.Detail = Detail;
	BB.Article = Article;
	BB.Comment = Comment;
	BB.Chat = Chat;
	
	BB.Ev = Ev;
	
})(this.BB);
