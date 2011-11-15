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
			this.channels.fetch();
			this.events.fetch();
		},
		updateModel: function(){
			var currentModel = this.get('currentModel'),
				getModel = this.detailedList.getByCid( currentModel.cid );

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
			//console.info('# Model.Channel.initialize');
		},
		defaults: {
			selected: false,
			detailSelected: false,
			type: 'channel'
		}
	});
	
	var Event = Backbone.Model.extend({
		name: 'events',
		initialize: function(){
			//console.info('# Model.Event.initialize');
		},
		defaults: {
			selected: false,
			detailSelected: false,
			type: 'event'
		}		
	});
	
	var Detail = Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.Detail.initialize');
		},
		defaults: {
			current: false
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
	BB.Article = Article;
	BB.Comment = Comment;
	BB.Chat = Chat;
	
	BB.Ev = Ev;
	
})(this.BB);
