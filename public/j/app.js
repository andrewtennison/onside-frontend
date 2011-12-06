var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

BB.appRoutes = Backbone.Router.extend({
	routes: {
		''				: 'home',
		'event/:id'		: 'getEvent',
		'channel/:id'	: 'getChannel',
		'search/:id'	: 'getSearch'
	},
	
	initialize: function(){
		console.info('# appRoutes.initialize');
		
		// App model	
		on.m.app = new BB.App(this);
		
		// Create main views
		// Application view
		on.v.onsideApp = new BB.AppView({
			el: $('#OnsideApp'),
			app: on.m.app
		});
		// Navigation view		
		on.v.nav = new BB.NavView({ app: on.m.app });
		
		// Detail view
		on.v.detailList = new BB.DetailListView({ app: on.m.app });
		
		// Search view
		on.v.search = new BB.SearchView({ app: on.m.app });
		
		// Post Comment view
		on.v.postComment = new BB.CommentPostView({ app: on.m.app });
		
		// Comment view
		on.v.comment = new BB.CommentListView({ app: on.m.app });
		
		on.m.app.channels.fetch();
		on.m.app.events.fetch();
	},
	
	home: function(){
		console.log('// Routes = "/"  (index)');
		on.m.app.set({ selectedItemUID : 'channel|null' });
	},
	
	getEvent: function( id ){
		console.log('// Routes = "/events/'+id+'"');
		on.m.app.set({ selectedItemUID : 'event|'+id });
	},
	
	getChannel: function( id ){
		console.log('// Routes = "/channel/'+id+'"');
		on.m.app.set({ selectedItemUID : 'channel|'+id });
	},
	
	getSearch: function( id ){
		console.log('// Routes = "/search/'+id+'"');
		on.m.app.set({ selectedItemUID : 'search|'+id });
	}
});

var onside = new BB.appRoutes();
Backbone.history.start();
