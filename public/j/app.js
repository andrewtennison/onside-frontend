var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};
on.preload = window.on.preload || {};

BB.appRoutes = Backbone.Router.extend({
	routes: {
		''								: 'home',
		'/event/:id'					: 'getEvent',
		'/channel/:id'					: 'getChannel',
		'/search/:id'					: 'getSearch',
		'/:service/:id/article-:id2'	: 'getArticle',
		'*path'							: 'home'
	},
	
	initialize: function(){
		console.info('# appRoutes.initialize');
		
		/*
		 look for local.session storage - saved preferences to load
		 */
		
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
		on.v.postTweet	= new BB.TweetPostView({ app: on.m.app });
		
		// Comment view
		on.v.comment = new BB.CommentListView({ app: on.m.app });
		//on.v.comment.defaultTab = false;
		
		// If JSON is preloaded use it, else fetch from server
		function preLoadContent(type,data){
			if(!data){
				// false - broken request - fetch
				on.m.app[type].fetch();
			}else if(data.length >= 1){
				// load content
				on.m.app[type].reset(data);
			}else if(data.length === 0){
				// no results - reset empty collection to fire event and setup views
				on.m.app[type].reset();
			};
		};
		
		preLoadContent('channels', on.preload.channels);
		preLoadContent('events', on.preload.events);
		preLoadContent('searches', on.preload.searches);		
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
Backbone.history.start({pushState: false});
