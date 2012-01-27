var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	

	var Users = Backbone.Collection.extend({
		model : BB.User,
		url: on.path.api + '/user/list',
		parse: function(resp, xhr) {
			return resp.resultset.users;
		}
	});
	
	var Channels = Backbone.Collection.extend({
		model : BB.Channel,
		url: on.path.api + '/channel',
		parse: function(resp, xhr) {
			return resp.resultset.channels;
		}
	});
	
	var Events = Backbone.Collection.extend({
		model : BB.Event,
		url: on.path.api + '/event',
		parse: function(resp, xhr) {
			return resp.resultset.events;
		}
	});

	var Sources = Backbone.Collection.extend({
		model : BB.Source,
		url: on.path.api + '/source',
		parse: function(resp, xhr) {
			return resp.resultset.sources;
		}
	});

	var Articles = Backbone.Collection.extend({
		model : BB.Article,
		url: on.path.api + '/article?limit=20',
		parse: function(resp, xhr) {
			return resp.resultset.articles;
		}
	});

	BB.Users = Users;
	BB.Channels = Channels;
	BB.Events = Events;
	BB.Sources = Sources;
	BB.Articles = Articles;

})(this.BB);
