var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};
on.preload = window.on.preload || {};

BB.appRoutes = Backbone.Router.extend({
	routes: {
		''								: 'home',
		'/:static'						: 'static',
		'channel/create/:id2'			: 'createChannel',
		':service/:id/:id2'				: 'getArticle',
		':service/:id'					: 'getDetail',
		'search?q=:id'					: 'getSearch',
		'*path'							: 'home'
	},
	
	initialize: function(){
		console.info('# appRoutes.initialize');
		
		// if( (/iphone|ipad/gi).test(window.navigator.userAgent) ){
			// $('body').css({bottom:'-60px'});
			// $('body').scrollTop(1);
		// }
		/*
		 look for local.session storage - saved preferences to load
		 */
		
		// App model	
		on.m.app = new BB.App(this);
		on.m.app.set({ userAuth : (on.preload.auth === true)? true : false });
		on.m.app.set({ user : (on.preload.user)? on.preload.user : false });
		on.m.app.set({ twitter : (on.preload.twitter)? on.preload.twitter : false });
		on.m.app.set({ facebook : (on.preload.facebook)? on.preload.facebook : false });
		
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
		
		// Comment view
		on.v.comment = new BB.CommentListView({ app: on.m.app });
		
		//on.v.comment.defaultTab = false;
		/*
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
		*/
		// on.m.app.channels.fetch();
		// on.m.app.events.fetch();
		// on.m.app.searches.fetch();
	},
	home: function(){
		console.log('// Routes = "/"  (index)');
		if(on.m.app.get('user').status == 1){
			on.m.app.set({ selectedItemUID : 'static|welcome', selectedArticle: false });
		}else{
			on.m.app.set({ selectedItemUID : 'list|home', selectedArticle: false });
		}
	},
	static: function( static ){
		console.log('// Routes = "/"  (static):' + static);
		on.m.app.set({ selectedItemUID : 'static|'+static, selectedArticle: false });
	},
	getDetail: function(service, id){
		console.log('// Routes = "/'+service+'/'+id+'"');
		if(id === '') {
			on.m.app.set({ selectedItemUID : 'list|home', selectedArticle: false });			
		} else {
			on.m.app.set({ selectedItemUID : service + '|' + id, selectedArticle: false });
		};
	},
	getSearch: function( id ){
		console.log('// Routes = "/search/'+id+'"');
		on.m.app.set({ selectedItemUID : 'search|'+id, selectedArticle: false });
	},
	getArticle: function( service, id, id2){
		var article = id2.replace('article-','');
		
		on.m.app.set({ 
			selectedItemUID : service +'|'+ id,
			selectedArticle : article
		});
	},
	createChannel: function(id){
		console.log('// Routes = "/channel/create/'+id+'"');
		on.m.app.set({ selectedItemUID : 'channel|create|'+id, selectedArticle: false });
	}
});

var onside = new BB.appRoutes();
Backbone.history.start({pushState: false});
