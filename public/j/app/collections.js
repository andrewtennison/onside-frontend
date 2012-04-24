var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Collections

(function(BB){

	var _Lists = Backbone.Collection.extend({
		// overiden in extended objects
		urlPath:'',
		parsePath: function(){
			return this.urlPath + 's';
		},
		params: false,
		url: function(){
			var p;
			switch(typeof this.params){
				case 'object':
					p = $.param( this.params );
					break;
				case 'function':
					p = this.params();
					break;
				case 'string':
					p = this.params;
					break;
				default:
					p = '';
					break;
			}
			
			return on.path.api + '/' + this.urlPath +'?'+ p;
		},
		parse: function(resp, xhr) {
			if(!resp || resp.length == 0) return resp;
			if(this.parsePath) return resp.resultset[ this.parsePath() ];
		},
		initialize:function(){
			//console.info('# Collection._Lists.initialize: ' + this.urlPath);
		},
		fetchNextPage: false
	});
	
	var ChannelList = _Lists.extend({
		localStorage: new Backbone.LocalStorage("onside.channels"),
		a: 'channelList',
		urlPath: 'channel',
		model : BB.Channel,
		comparator : function(channel) {
			//return channel.get("name");
			var date = channel.get('latestArticleDate');
			return (date)? -date : channel.get("name");
		}
    });

	var EventList = _Lists.extend({
		localStorage: new Backbone.LocalStorage("onside.events"),
		a: 'eventList',
		urlPath: 'event',
		// params: function(opts){
			// var days = (opts.days)? opts.days : 7;
// 			
			// var today = new Date();
			// today.setDate(today.getDate() - days);
			// var nd = new Date(newdate),
				// date = nd.getYear() +'-'+ nd.getMonth() +'-'+ nd.getDay();
// 
			// return 'channel='+ opts.channel +'&stime=>'+date+'&sort=stime+desc&limit[0]=10&limit[1]=0';
// 			
			// //?channel=13&stime=<2012-03-09sort=stime+desc&limit[0]=10&limit[1]=0
			// var o = {
				// channel:'',
// 				
			// };
		// },
		model : BB.Event,
		comparator : function(model) {
			var P = model.get("stime"),
				D = new Date(P.replace(' ', 'T')).getTime(),
				C = new Date().getTime(),
				diff = (C-D < 0)? C - D : (C - D)*-1;

			return -diff;
		}
	});
		
	var SavedSearchList = _Lists.extend({
		a: 'saveSearchList',
		urlPath: 'search/list',
		parsePath: function(){ return 'searches'; },
		model : BB.SavedSearch
    });

	var ArticleList = _Lists.extend({
		a: 'articleList',
		itemsPerPage: 10,
		urlPath: 'article',
		model : BB.Article,
		filters:{},
		selectedModel: false,
		initialize: function(app){
			this.app = app;
		},
		comparator : function(Article) {
			var P = Article.get("publish"),
				D = new Date(P.replace(' ', 'T'));
			return - D.getTime();
		},
		myFilter: function(attr, val){
			console.log(attr +' / '+val);
			var groupByAttr = this.groupBy(function(article){
				var res = (val === undefined)? true : (article.get(attr) == val);
				article.set({selected:res});
				return res;
			});
			console.info(groupByAttr)
			return groupByAttr;
		},
		paginationParams: function(refresh){
			return (refresh)? 'limit=' + this.itemsPerPage : 'limit[0]=' + this.itemsPerPage + '&limit[1]='+ this.length;
		}
	});

	var DetailList = Backbone.Collection.extend({
		localStorage: new Backbone.LocalStorage("onside.detailed"),
		a: 'detailList',
		model: BB.Detail,
		parsePath: false,
		url: function(action, id){
			var arr = this.id.split('|');
			return '/' +arr[0]+ '/' + arr[1] +'/'+ arr[2];
		},
		comparator: function(){
			// sort models.. by the users default order if available?
		},
		selected: false,
		initialize: function(){
			_.bindAll(this, 'createModel', 'fetchModel');
		},
		fetchModel: function(selectedItemUID, detailUID){
			var self = this,
				s = selectedItemUID.split('|'),
				type = s[0],
				id = s[1],
				hash = {
					id:detailUID,
					type:s[0].toLowerCase(),
					val:s[1].toLowerCase()
				},
				model;
			
			// hide existing model
			if(this.selected !== false) {
				this.get(this.selected).set({ selected : false});
				this.selected = false;
			};

			// if model exists show it
			if( this.get( detailUID ) ) {
				this.get(detailUID).set({selected:true});
				this.selected = detailUID;
				this.trigger('change:selected');
				return;
			};
			
			this.requested = detailUID;
			
			if( (/create|edit|delete/gi).test(s[1]) ){
				hash.form = true;
				this.add(hash);
				return;
			};

			switch(type){
				case 'static':
					this.add(hash);
					return;
				case 'search':
					model = new BB.DetailSearch(hash);
					break;
				case 'channel':
					model = new BB.DetailChannel(hash);
					break;
				case 'event':
					model = new BB.DetailEvent(hash);
					break;
				case 'list':
					// model = new BB.DetailList(hash);
					// break;
				default:
					model = new BB.Detail(hash);
					break;
			}
			model.fetch({
				success:function(data){
					self.createModel(model);
				}, error:function(err){
					model.set({
						title: '404 error',
						type: 'error'
					});
					self.createModel(model);
				}
			});
		},
		createModel: function(model){
			model.set({
				channelJson	: model.get('channels'),
				channels	: new BB.ChannelList(this.app),

				eventJson	: model.get('events'),
				events		: new BB.EventList(this.app),

				articleJson	: model.get('articles'),
				articles	: new BB.ArticleList(this.app)
			});
			
			if( this.requested == model.id ) {
				this.selected = model.id;
				model.set({ selected: true})
				this.trigger('change:selected');

			} else {
				model.set({ selected: false})
			}
			
			this.add(model);
		}
	});
	
	var CommentList = Backbone.Collection.extend({
		localStorage: new Backbone.LocalStorage("onside.comments"),
		model : BB.Comment,
	
		url : function(){
			return on.path.api + '/comment' + this.urlParams;
		},
		urlParams: '',
		
		parse: function(resp, xhr){
			return resp.resultset.comments;
		},
		comparator : function(Comment) {
			//return Comment.get("created_at");
		},
		initialize: function(models,app){
			on.helper.log('# Collection.CommentList.initialize','info');
			this.app = app;
			//_.bindAll(this, 'updateCollection');
			//this.app.bind('change:selectedItemUID', this.updateCollection);
		},
		updateCollection: function(){
			var s = this.app.get('selectedItemUID').split('|');
			
			this.reset();
			if(s[1] === 'null') {
				on.helper.log('Model.App.updateComments - selectedItemUID = ' + s[0] +'|'+ s[1], 'error');
			} else {
				this.urlParams = '?' + s[0] +'='+ s[1];
				this.fetch();
			}
		}
		
	});
	var TweetList = Backbone.Collection.extend({
		//localStorage: new Backbone.LocalStorage("onside.tweets"),
		//model : BB.tweet,
		hash: false,

		url : function(){
			if(!this.hash) return;
			return '/tweet/' + this.hash.replace('#','');
		},
		parse: function(resp, xhr){
			this.refreshUrl = resp.refresh_url;
			return resp.results;
		},
		comparator : function(tweet) {
			return tweet.get("created_at");
		},
	});

	// Assign to BB namespace
	BB.ChannelList = ChannelList;
	BB.EventList = EventList;
	BB.SavedSearchList = SavedSearchList;
	BB.DetailList = DetailList;
	BB.ArticleList = ArticleList;
	BB.CommentList = CommentList;
	BB.TweetList = TweetList;

})(this.BB);
