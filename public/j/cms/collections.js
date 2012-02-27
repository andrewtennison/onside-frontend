var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	
	var _default = Backbone.Collection.extend({
		url: function(){
			return on.path.api + '/' + this.path + '?' + this.params;
		},
		path: '',
		params: '',
		parseName: function(){
			return (this.path)? this.path + 's' : false;
		},
		parse: function(resp, xhr) {
			var p = (typeof this.parseName === 'function')? this.parseName() : this.parseName;
			return (this.parseName)? resp.resultset[p] : resp;
		}
	});

	var Users = _default.extend({
		model : BB.User,
		path: 'user/list',
		parseName: 'users'
	});
	
	var Channels = _default.extend({
		model : BB.Channel,
		path : 'channel'
	});
	
	var Events = _default.extend({
		model : BB.Event,
		path : 'event'
	});

	var Sources = _default.extend({
		model : BB.Source,
		path : 'source'
	});

	var Articles = _default.extend({
		model : BB.Article,
		path : 'article',
		params: 'limit=20',
	});

	var Emails = _default.extend({
		model : BB.Email,
		path : 'email'
	});

	BB.Users = Users;
	BB.Channels = Channels;
	BB.Events = Events;
	BB.Sources = Sources;
	BB.Articles = Articles;
	BB.Emails = Emails;

})(this.BB);
