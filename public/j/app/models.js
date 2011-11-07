var on = window.on || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models

on.App		= Backbone.Model.extend({
	initialize: function(){
		console.info('# Model.App.initialize');
	},
	defaults: {
		list: null,
		currentList: null,
		currentListItem: null,
		currentUrl: null,
		currentModel: null
	}
});

on.Channel 	= Backbone.Model.extend({
	initialize: function(){
		console.info('# Model.Channel.initialize');
	},
	defaults: {
		selected: false
	}
});

on.Event 	= Backbone.Model.extend({
	initialize: function(){
		console.info('# Model.Event.initialize');
	},
	defaults: {
		selected: false
	}		
});

on.Article 	= Backbone.Model.extend({
	initialize: function(){
		console.info('# Model.Article.initialize');
	}
});

on.Comment 	= Backbone.Model.extend({
	initialize: function(){
		console.info('# Model.Comment.initialize');
	}
});

on.Chat 	= Backbone.Model.extend({
	initialize: function(){
		console.info('# Model.Chat.initialize');
	}
});



// extend events for custom scenarios
on.Ev = {};
on.Ev.footballMatch = on.Event.extend({});
