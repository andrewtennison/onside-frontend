var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};
on.preload = window.on.preload || {};

BB.appRoutes = Backbone.Router.extend({
	routes: {
		''								: 'home',
		'/user/:id'						: 'getUser',
		'/:action'						: 'openPage',
		'/:action/:id'					: 'openOverlay',

		'*path'							: 'home'
	},
	
	initialize: function(){
		// App model	
		on.m.cms = new BB.CMS(this);
		var cmsView = new BB.cmsView({ cms:on.m.cms });
	},
	
	home: function(){
		console.log('// Routes = "/"  (index)');
		on.m.cms.set({ selectedPage:'dashboard'});
	},

	openPage: function(action){
		console.log('// Routes = "/"  (index)');
		on.m.cms.set({selectedPage:action});
	},

	openOverlay: function(action,id){
		console.log('// Routes = "/"  (index)');
		on.m.cms.set({
			selectedPage:action,
			selectedItem:id
		});
	}
});

var onside = new BB.appRoutes();
Backbone.history.start({pushState: false});
