var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

BB.appRoutes = Backbone.Router.extend({
	routes: {
		''				: 'home',
		'event/:id'		: 'getEvent',
		'channel/:id'	: 'getChannel',
		'search/:id'	: 'getSearch',
		':service/:id/article-:id2'	: 'getArticle'
	},
	
	initialize: function(){
		console.info('# appRoutes.initialize');
		
		// App model	
		on.m.app = new BB.App(this);
		on.m.app.set({ userAuth : (on.preload.auth === true)? true : false });
		
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

		// Article Detail view
		on.v.articleList = new BB.ArticleDetailView({ app: on.m.app });
		
		// Search view
		on.v.search = new BB.SearchView({ app: on.m.app });
		
		// Post Comment view
		on.v.postComment = new BB.CommentPostView({ app: on.m.app });
		on.v.postTweet	= new BB.PostTweet({ app: on.m.app });
		
		// Comment view
		on.v.comment = new BB.CommentListView({ app: on.m.app });
		
		// If JSON is preloaded use it, else fetch from server
		on.preload = window.on.preload || {};
		var p = on.preload; 

		// on.m.app.channels.reset(on.preload.channels)
		(p.channels === undefined || p.channels.length === 0)? 	on.m.app.channels.fetch() 	: on.m.app.channels.reset(on.preload.channels); 
		(p.events === undefined || p.events.length === 0)?		on.m.app.events.fetch() 	: on.m.app.events.reset(on.preload.events); 
		(p.searches === undefined || p.searches.length === 0)?	on.m.app.searches.fetch()	: on.m.app.searches.reset(on.preload.searches);
	},
	
	home: function(){
		console.log('// Routes = "/"  (index)');
		on.m.app.set({ selectedItemUID : 'channel|null' });
	},
	
	getEvent: function( id ){
		console.log('// Routes = "/events/'+id+'"');
		if(id === '') id = null;
		on.m.app.set({ selectedItemUID : 'event|'+id });
	},
	
	getChannel: function( id ){
		console.log('// Routes = "/channel/'+id+'"');
		if(id === '') id = null;
		on.m.app.set({ selectedItemUID : 'channel|'+id });
	},
	
	getSearch: function( id ){
		console.log('// Routes = "/search/'+id+'"');
		on.m.app.set({ selectedItemUID : 'search|'+id });
	},
	
	getArticle: function( service, id, id2){
		on.m.app.set({ 
			selectedItemUID : service +'|'+ id,
			selectedArticle :  'article-' + id2
		});		
	}
});

var onside = new BB.appRoutes();
Backbone.history.start();
