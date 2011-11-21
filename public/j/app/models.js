var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){

	var App	= Backbone.Model.extend({
		initialize: function(){
			console.info('# Model.App.initialize');
			
			_.bindAll(this, 'updateUrl', 'updateModel');
			
			// create + init collections for channels + events
			this.channels = new BB.ChannelList({ appUrl: this.currentUrl });
			this.events = new BB.EventList({ appUrl: this.currentUrl });
			this.detailedList = new BB.DetailList();
			
			this.bind('change:currentUrl', this.updateUrl);
			this.bind('change:currentModel', this.updateModel);
		},
		defaults: {
			list: null,
			currentUrl: null,
			currentListName: null,
			currentItemCid: null,
			currentModel: null
		},
		updateUrl: function(){
			this.channels.fetch({
				beforeSend:function(xhr){
					// xhr.setRequestHeader('Origin', 'http://dev.onside.me')
					// xhr.setRequestHeader('Access-Control-Request-Method', 'POST,GET,DELETE');
					// xhr.setRequestHeader('Access-Control-Request-Headers','OnsideAuth')
					// xhr.setRequestHeader('OnsideAuth', '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b73648')
				}
			});
			this.events.fetch();
		},
		updateModel: function(){
			// add new detail.model to detailList collection
			// this.detailedList.add({})
			
			
			var currentModel = this.get('currentModel'),
				getModel = this.detailedList.get( currentModel.id );

			if(getModel === undefined) {
				this.detailedList.add(currentModel);
				currentModel.set({detailSelected:true});
			} else {
				getModel.set({detailSelected:true});
			};
		},
	});

	var Channel = Backbone.Model.extend({
		name: 'channels',
		initialize: function(){
			console.info('# Model.Channel.initialize');
		},
		defaults: {
			selected		: false,
			detailSelected 	: false,
			type 			: 'channel',
			
			// DB model structure
			id 				: undefined,
			name 			: undefined,
			description 	: undefined,
			// type 			: undefined, duplicate - is mine used, if so rename mine
			sport 			: undefined,
			level 			: undefined,
			geolat 			: null,
			geolng 			: null
		}
	});
	
	var Event = Backbone.Model.extend({
		name: 'events',
		initialize: function(){
			console.info('# Model.Event.initialize');
		},
		defaults: {
			selected: false,
			detailSelected: false,
			type: 'event',

			// DB model structure
			name 			: undefined,
			sport			: undefined,
			type 			: undefined,
			geolat			: null,
			geolng			: null			
		},
		sync: function(method, model, options) {
			options = _.extend({
				beforeSend: function(xhr, settings) {
					alert('!!!!')
					xhr.setRequestHeader( 'OnsideAuth', '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b736482' );
				}
			}, options);
			return Backbone.sync(method, model, options);
		}
	});
	
	var Detail = Backbone.Model.extend({
		// channels: null,
		// events: null,
		// articles: null,
		initialize: function(){
			//console.info('# Model.Detail.initialize');
		},
		defaults: {
			current: false,
			type: undefined
		}
	});

	var Article = Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.Article.initialize');
		}
	});
	
	var Comment = Backbone.Model.extend({
		initialize: function(){
			console.info('# Model.Comment.initialize');
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
	BB.Detail = Detail;
	BB.Article = Article;
	BB.Comment = Comment;
	BB.Chat = Chat;
	
	BB.Ev = Ev;
	
})(this.BB);
