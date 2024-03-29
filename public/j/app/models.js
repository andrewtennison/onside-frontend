var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	
	var App	= Backbone.Model.extend({
		initialize: function(route){
			//on.helper.log('# Model.App.initialize','info');
			var app = this;
			this.route = route;
			
			_.bindAll(this, 'updateService', 'setTitle');
			
			// create + init collections for channels + events
			// this.user = new BB.User();
			
			this.channels = new BB.ChannelList();
			this.channels.params = {user:'me'};
			
			this.events = new BB.EventList();
			this.events.params = {user:'me'};
			
			this.searches = new BB.SavedSearchList();
			this.searches.params = {user:'me'};

			this.detailedList = new BB.DetailList();
			this.comments = new BB.CommentList(false,app);
			this.tweets = new BB.TweetList(false,app);
			
			this.bind('change:selectedItemUID change:selectedArticle', this.updateService);
		},
		defaults: {
			user: null,
			selectedServiceName: null,
			selectedItemUID: null,
			selectedItemTitle: null,
			searchModel: null,
			selectedArticleList: null,
			selectedArticle: null
		},
		setTitle: function(){
			var title, model,
				UID = this.get('selectedItemUID'),
				article = this.get('selectedArticle');
			
			if(article){
				model = this.get('selectedArticleList').get(article);
			}else if(UID.split('|')[1] !== null){
				model = this.detailedList.get('detail|' + UID);
			} else {
				model = false;
			}

			title = (model)? ( model.get('name') || model.get('title') ) : 'Onside home';
			this.set({selectedItemTitle : title})
		},
		updateService: function(model,val){
			var article = this.get('selectedArticle'),
				url = '/' + this.get('selectedItemUID').replace(/\|/g,'/').replace('static','') + ((article)? '/article-' + article : '');
				
			this.route.navigate(url);
			this.set({ selectedServiceName : this.get('selectedItemUID').split('|')[0] });
			
			//var url = document.location.href.replace(/\/?#!/, '/');
			if(typeof _gaq !== 'undefined' && this.saveUrl !== url) _gaq.push(['_trackPageview', url]);
			this.saveUrl = url;
		}
	});

	var User = Backbone.Model.extend({
		url: function(){
			return on.path.api + '/user/' + this.id;
		},
		parse: function(resp, xhr) {
			return resp.resultset.users[0];
		},
		validate: function(){
			// on post - check ID == this.users id + if confirmPassword = password
		},
		defaultOpts: {
			id			: {type:'text', editable:false},
			avatar		: {type:'text'},
			name		: {type:'text'},
			email		: {type:'email'},
			admin		: {type:'select', values:[0,1]},
			enabled		: {type:'select', values:[0,1]},
			status		: {type:'select', values:[0,1,2,3,4,5,6,7,8,9]},
			password	: {type:'text'},
			twitter		: {type:'text'},
			facebook	: {type:'text'},
			google		: {type:'text'},
			language	: {type:'text'},
			added		: {type:'text'},
		}
	});

	var Channel = Backbone.Model.extend({
		url: function(){
			if(this.id){
				return on.path.api + '/channel/' + this.id;
			}else{
				return on.path.api + '/channel';
			}
		},
		service: 'channel',
		initialize: function(){
			this.setImage();
		},
		setImage: function(){
			var attr = this.attributes;
			
			var sport = this.get('sport'),
				image = this.get('image');
			
			if(attr.sport && ( attr.image === 'null' || attr.image === '' )){
				var imagePath;
				switch(attr.sport){
					case 'golf':
						imagePath = '/i/content/channel/_golf.png';
						break;
					case 'football':
						imagePath = '/i/content/channel/_football.png'
						break;
					default:
						imagePath = this.defaults.image;
						break;
				};
				this.set({image:imagePath});
			}
		},
		parse: function(resp){
			//return resp.resultset.channels[0];
			return resp
		},
		defaultOptions: {
			name: {required:true, regex: true},
			search_term: {required:true, regex: true},
			sport: {required:true, values: on.settings.sports},
			type: {required:true, values: on.settings.channelType}
		},
		defaults: {
			selected	: false,
			service		: 'channel',
			image		: '/i/placeholder/listIcon2.png',
			
		// DB model structure
			// id 				: '',
			// name 			: '',
			// description 		: '',
			// type 			: '',
			// sport 			: '',
			// level 			: '',
			// geolat 			: '',
			// geolng 			: ''

			//{"hash":"","name":"chris hoy","image":"","description":"british cyclist","sport":"cycling","type":"player","level":"","keywords":"chris hoy","branding":"","geolat":"","geolng":"","status":"active","search_term":"chris hoy"}

		},
		validate: function(attr){
			// console.info('# Model.Channel.validate');
			// var err = [], key;
			// for(key in this.defaultOptions){
				// var obj = this.defaultOptions[key];
				// if(obj.required && this.test(attr[key], obj)){
					// err.push({ name: key, msg: key + ' is required. Please ' + ((obj.regex)? 'enter' : 'select') + 'a value' })
				// }
			// };
			// if(err.length) return err;
		},
		test: function(val, obj){
			var res = true;
			if(!val || val.length == 0){
				res = false;
			}else if(obj.regex){
				res = (/^[a-zA-Z-'\.\s]{2,128}$/gi).test(val);
			}else if(obj.values){
				if( _.indexOf(obj.values, val) === -1 ) res = false;
			}
			return res;
		}
	});
	
	var Event = Backbone.Model.extend({
		service: 'events',
		defaults: {
			selected	: false,
			service		: 'event',
			img			: '/i/placeholder/listIcon2.png'

		// DB model structure
			// service 			: undefined,
			// sport			: undefined,
			// type 			: undefined,
			// geolat			: null,
			// geolng			: null			
		},
		parse: function(resp){
			//resp.participants = this.makeObject(resp.participants);
			return resp;
		},
		makeObject: function(val){
			var t = val.split(/\}\,\s?{/g),
				i = 0, 
				l = t.length, 
				arr = [];
				
			for(i; i<l; i++){ 
			    var tmp = t[i].replace(/\{|\}/g,'').split(','),
			    	j = 0, ll = tmp.length,
			    	obj = {};

			    for(j; j<ll; j++){
			        var tmp2 = tmp[j].split(':');
			        obj[ tmp2[0] ] = tmp2[1];
			    }
			    arr.push(obj)
			};
			return arr;
		}
	});

	var SavedSearch = Backbone.Model.extend({
		url: function(){
			//return on.path.api + '/search/save' + this.id;
		},
		service: 'search',
		initialize: function(){
			on.helper.log('# Model.SavedSearch.initialize','info');
		},
		parse: function(resp){
			//return resp.resultset.searches[0];
			return resp
		},
		defaults: {
			selected	: false,
			service		: 'search',
			name		: null,
			query		: null			
		}
	});
	
	var Search = Backbone.Model.extend({
		url: function(){
			return on.path.api + '/search?q=' + this.query;
		},
		query: '',
		service: 'search',
		parse: function(resp){
			return {
				id			: this.query.replace(' ', '_'),
				service		: resp.service,
				title		: this.query,
				channels	: resp.resultset.channels,
				events		: resp.resultset.events,
				articles	: resp.resultset.articles,
			};
		},
		initialize: function(){
			on.helper.log('# Model.Search.initialize','info');
		}
	});
	
	var Detail = Backbone.Model.extend({
		localStorage: new Backbone.LocalStorage("onside.detail"),
		url: function(){
			return '/' + this.id.replace(/\|/g,'/');
			//return '/' + this.id.replace(/\|/g,'/') + '?grouped=20';
		},
		defaults: {
			selected 	: false,
			title		: '',
			type		: 'default',
			image		: '/i/placeholder/listIcon2.png',
			saved		: false
		},
		refresh: function(){
			this.get('channels').reset(this.get('channelJson'));
			this.get('events').reset(this.get('eventJson'));
			this.get('articles').reset(this.get('articleJson'));
		},
		setSaved: function(app){},
		follow : function(){}
	});
	var DetailChannel = Detail.extend({
		parse: function(attr){
			if(attr.author && attr.image === undefined && (attr.author.image === 'null' || attr.author.image === '')){
				switch(attr.author.sport){
					case 'golf':
						attr.image = '/i/content/channel/_golf.png';
						break;
					case 'football':
						attr.image = '/i/content/channel/_football.png'
						break;
					default:
						attr.image === this.defaults.image
						break;
				};
			};
			return attr;
		},
		setSaved: function(app){
			var id = this.get('author').id,
				val = (app.channels.get(id))? true : false;
			this.set({saved: val });
		},
		follow : function(app){
			var self = this,
				saved = this.get('saved'),
				id = this.get('author').id,
				url = on.path.api + '/channel/';
			
			url += (saved)?	'unfollow' : 'follow';

			console.log(saved +' || '+url);
			$.post(url, {channel: id})
			.success(function(){
				self.set({saved: (!saved) });
				app.channels.fetch();
			}).error(function(res){
				console.error(res)
			});
		}
	});
	var DetailSearch = Detail.extend({
		initialize: function(){
			this.set({image: '/i/content/channel/_search.png'});
		},
		setSaved: function(app){
			console.info('////// set saved')
			console.log(this)
			
			
			var id = this.get('title'),
				val = (app.searches.get(id))? true : false;
			this.set({saved: val });
		},
		follow: function(app){
			console.dir(this.attributes);
			var self = this,
				saved = this.get('saved'),
				url = on.path.api + '/search/',
				title = this.get('title');
			console.log(this)
			url += (saved)? 'unsave' : 'save';
			$.post(url, {query:title, name:title})
			.success(function(){
				self.set({saved:true});
				app.searches.fetch();
			})
			.error(function(res){
				console.error(res)
			});
			
		}
		
	});
	var DetailEvent = Detail.extend({
		initialize: function(){
			this.set({image: '/i/content/channel/_event.png'});
		}
	});

	var Article = Backbone.Model.extend({
		url: function(){
			return on.path.api + '/article/' + this.id
		},
		initialize: function(){
			//on.helper.log('# Model.Article.initialize', 'info');
		},
		defaults: {
			selected : false,
			filtered : true
		},
		parse: function(resp, xhr){
			if(resp.resultset){
				resp = resp.resultset.articles[0];
			}
			console.info(resp)
			if(resp.type === 'youtube'){
				resp.vid = resp.videos.replace('http://gdata.youtube.com/feeds/base/videos/','');
			}
			return resp;
		}
	});
	
	var Article_eson = Article.extend({
		url: function(){
			return 'http://api.espn.com/v1/sports/news/'+ this.espnId +'?apikey=r9pdcgqrv7cskwch8g59s955'
		},
		parse: function(resp){
			var obj = {};
			obj.published = resp.timestamp
			
			return obj;
		}
	});
	
	var Comment = Backbone.Model.extend({
		initialize: function(){
			//on.helper.log('# Model.Comment.initialize','info');
		},
		defaults: {
			service	: 'comment',
			//id		: null,
			// article	: null,
			// channel 	: null,
			// event	: null,
			// user 	: null,
			// reply	: null,
			// comment 	: null,
			// added 	: null
		}
		
		
	});
	
	var Chat = Backbone.Model.extend({
		initialize: function(){
			on.helper.log('# Model.Chat.initialize','info');
		}
	});
	
	var Tweet = Backbone.Model.extend({
///		url: '/tweet',
		inititalize: function(){
			console.log('model.tweet.init')
		},
		defaults: {
			created_at: false,
			profile_image_url : false,
			source: false
		}
	});
	
	
	// extend events for custom scenarios
	var Ev = {};
	Ev.footballMatch = Event.extend({});
	
	BB.App = App;
	BB.Channel = Channel;
	BB.Event = Event;
	BB.SavedSearch = SavedSearch;
	BB.Search = Search;
	BB.Detail = Detail;
	BB.DetailChannel = DetailChannel;
	BB.DetailSearch = DetailSearch;
	BB.DetailEvent = DetailEvent;
	BB.Article = Article;
	BB.Comment = Comment;
	BB.Chat = Chat;
	BB.Tweet = Tweet;
	
	BB.Ev = Ev;
	
})(this.BB);
