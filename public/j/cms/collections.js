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


	BB.Users = Users;

})(this.BB);
