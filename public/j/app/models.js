var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){

	var App	= Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.App.initialize');
		},
		defaults: {
			list: null,
			currentList: null,
			currentListItem: null,
			currentUrl: null,
			currentModel: null
		}
	});
	
	var Channel = Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.Channel.initialize');
		},
		defaults: {
			selected: false
		}
	});
	
	var Event = Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.Event.initialize');
		},
		defaults: {
			selected: false
		}		
	});
	
	var Detail = Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.Detail.initialize');
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
