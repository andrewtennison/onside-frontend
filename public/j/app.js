var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

BB.appRoutes = Backbone.Router.extend({
	routes: {
		''			: 'home',
		
		// ID could be a name or string
		'event/:id'		: 'getEvent',
		'channel/:id'	: 'getChannel',
		'user/:id'		: 'getAuth'

	},
	
	initialize: function(){
		console.info('# appRoutes.initialize');
				
		on.m.app = new BB.App();
		on.v.onsideApp = new BB.AppView({
			el: $('#OnsideApp'),
			app: on.m.app
		});
		
		// create + init collections for channels + events
		on.c.defaultChannels = new BB.ChannelList();
		on.c.defaultEvents = new BB.EventList();
		
		on.v.nav = new BB.NavView({
			app: on.m.app
		});
		
		on.v.detail = new BB.DetailView({
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
		
		on.myChannel = new BB.ChannelListView({
			collection : BB.ChannelList({ url : '/stubs/myChannels.js' })
		});
		
	}
	
});

var onside = new BB.appRoutes();
Backbone.history.start();
