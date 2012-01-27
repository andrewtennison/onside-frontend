var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};
on.preload = window.on.preload || {};

BB.appRoutes = Backbone.Router.extend({
	routes: {
		''								: 'home',
		'/user/:id'						: 'getUser',

		'*path'							: 'home'
	},
	
	initialize: function(){
		console.info('# appRoutes.initialize');
		
		/*
		 look for local.session storage - saved preferences to load
		 */
		
		// App model	
		on.m.cms = new BB.CMS(this);
		var cmsView = new BB.cmsView({ cms:on.m.cms });

	},
	
	home: function(){
		console.log('// Routes = "/"  (index)');
	}
});

var onside = new BB.appRoutes();
Backbone.history.start({pushState: false});
