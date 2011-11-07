var on = window.on || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

on.appRoutes = Backbone.Router.extend({
	routes: {
		''			: 'home',
		
		// ID could be a name or string
		'event/:id'		: 'getEvent',
		'channel/:id'	: 'getChannel',
		'user/:id'		: 'getAuth'

	},
	
	initialize: function(){
		console.info('# appRoutes.initialize');
				
		on.m.app = new on.App();
		on.v.onsideApp = new on.AppView({
			el: $('#OnsideApp'),
			app: on.m.app
		});
		
		// create + init collections for channels + events
		on.c.defaultChannels = new on.ChannelList();
		on.c.defaultEvents = new on.EventList();
		
		on.v.nav = new on.NavView({
			app: on.m.app
		});
		
	},
	
	home: function(){
		console.log('// Routes = "/"  (index)');
		
		on.m.app.set({currentList : 'channels'});
		on.m.app.set({list : on.c.defaultChannel});
		
	},
	
	getEvent: function( id ){
		console.log('// Routes = "/events/'+id+'"');
	},
	
	getChannel: function( id ){
		console.log('// Routes = "/channel/'+id+'"');
	},
	
	getAuth: function( id ){
		console.log('// Routes = "/user/'+id+'"');
		
		on.myChannel = new on.ChannelListView({
			collection : on.ChannelList({ url : '/stubs/myChannels.js' })
		});
		
	}
	
});

on.App = new on.appRoutes();
Backbone.history.start();
