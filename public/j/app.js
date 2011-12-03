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
		
	},
	
	home: function(){
		console.log('// Routes = "/"  (index)');
		
		on.m.app.set({
			selectedUrl : null,
			selectedServiceName : 'channels'
		});
		on.m.app.trigger('change:selectedUrl');
	},
	
	events: function(){
		console.log('// Routes = "/events"');
		on.m.app.set({selectedServiceName : 'events'});
	},
	
	getEvent: function( id ){
		console.log('// Routes = "/events/'+id+'"');
	},
	
	getChannel: function( id ){
		console.log('// Routes = "/channel/'+id+'"');
		on.m.app.set({
			list: null,
			//selectedUrl: null,
			selectedServiceName: 'channels',
			selectedItemId: '6',
			selectedItemCid: null,
			selectedModel: null,
			selectedDetailId: null
		}) ;
		
		//on.m.app.channels.add('')
		
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
