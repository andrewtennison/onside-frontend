var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

BB.appRoutes = Backbone.Router.extend({
	routes: {
		''				: 'home',
		'events'		: 'events',
		
		// ID could be a name or string
		'event/:id'		: 'getEvent',
		'channel/:id'	: 'getChannel',
		'user/:id'		: 'getAuth'

	},
	
	initialize: function(){
		console.info('# appRoutes.initialize');
		
		// App model	
		on.m.app = new BB.App();
		
		// Create main views
		// Application view
		on.v.onsideApp = new BB.AppView({
			el: $('#OnsideApp'),
			app: on.m.app
		});
		
		// Navigation view		
		on.v.nav = new BB.NavView({
			app: on.m.app
		});
		
		// Detail view
		on.v.detailList = new BB.DetailListView({
			app: on.m.app
		});
		
	},
	
	home: function(){
		console.log('// Routes = "/"  (index)');
		
		on.m.app.set({currentUrl : null});
		on.m.app.set({currentListName : 'channels'});
		on.m.app.trigger('change:currentUrl');
	},
	
	events: function(){
		console.log('// Routes = "/events"');
		on.m.app.set({currentListName : 'events'});
	},
	
	getEvent: function( id ){
		console.log('// Routes = "/events/'+id+'"');
	},
	
	getChannel: function( id ){
		console.log('// Routes = "/channel/'+id+'"');
	},
	
	getAuth: function( id ){
		console.log('// Routes = "/user/'+id+'"');
		
		on.myChannel = new BB.ChannelListView({
			collection : BB.ChannelList({ url : '/stubs/myChannels.js' })
		});
		
	}
	
});

var onside = new BB.appRoutes();
Backbone.history.start();
