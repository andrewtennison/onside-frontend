var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	
	var CMS	= Backbone.Model.extend({
		initialize: function(route){
			console.info('# Model.App.initialize');
			var app = this;
			this.route = route;
			
			this.users = new BB.Users();
			
			//_.bindAll(this, );
		},
		defaults: {
		}
	});

	var User = Backbone.Model.extend({
		defaults: {
			// "id":"1",
			// "name":null,
			// "email":"isaac.scott@gmail.com",
			// "password":null,
			// "facebook":"1",
			// "twitter":null,
			// "google":null,
			// "language":"en_gb",
			// "added":"2011-12-01 15:15:35",
			// "admin":"0",
			// "enabled":"1",
			// "status":"1"
		}
	});


	
	BB.CMS = CMS;
	BB.User = User;
	
})(this.BB);
