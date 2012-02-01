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
			return on.path.api + '/' + this.urlPath +'?'+ ( (typeof this.params === 'object')? $.param( this.params ) : this.params );
		},
		parse: function(resp, xhr) {
			if(this.parsePath) return resp.resultset[ this.parsePath() ];
		},
		initialize:function(){
			console.info('# Collection._Lists.initialize: ' + this.urlPath);
		}
	});
	
	var ChannelList = _Lists.extend({
		a: 'channelList',
		urlPath: 'channel',
		model : BB.Channel
    });

	var EventList = _Lists.extend({
		a: 'eventList',
		urlPath: 'event',
		model : BB.Event
	});
		
	var SavedSearchList = _Lists.extend({
		a: 'saveSearchList',
		urlPath: 'search/list',
		parsePath: function(){ return 'searches'; },
		model : BB.SavedSearch
    });

	var ArticleList = Backbone.Collection.extend({
		a: 'articleList',
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
		}
	});

	var DetailList = Backbone.Collection.extend({
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
		initialize: function(models,app){
			on.helper.log('# Collection.DetailList.initialize','info');

			this.app = app;
			_.bindAll(this, 'createModel', 'checkSetCreate', 'check', 'fetchModel');
			//this.bind('add', this.manageCollection);
			//this.app.bind('change:selectedItemUID', this.checkSetCreate)
			this.app.bind('change:selectedItemUID', this.check)
		},
		check: function(app,selectedItemUID){
			var s = selectedItemUID.split('|');
			if(s[1] === ('null' || null || 'home' || 'popular')) s[0] = 'list'
			
			var detailUID = 'detail|' + selectedItemUID;
			
			// if there is a current model hide it
			if(this.selected !== false) {
				this.get(this.selected).set({ selected : false});
			};

			// if model exists show it
			if( this.get( detailUID ) ) {
				this.get(detailUID).set({selected:true});
				this.selected = detailUID;
			}else{
				this.fetchModel(selectedItemUID, detailUID);
			}	
		},
		fetchModel: function(selectedItemUID, detailUID){
			var self = this,
				s = selectedItemUID.split('|'),
				type = s[0],
				id = s[1],
				model = new BB.Detail({id:detailUID}); //new this.model({id:detailUID});
			
			model.fetch({
				success:function(data){
					console.log('success');
					self.createModel(model);
				}, error:function(err){
					console.error(err)
				}
			});
		},
		checkSetCreate: function(model,val){
			var self = this,
				selectedItemUID = val,
				detailUID = 'detail|' + selectedItemUID,
				s = selectedItemUID.split('|'),
				existingModel = this.get( detailUID ),
				search = (s[0] === 'search')? true : false,
				model = new this.model({id:detailUID});
				
			model.bind('error', function(model,error){
				console.error('error - detailed model does not exist');
			});
			
			console.error('checkset')
			console.log(this.selected)
			console.log(existingModel)
			console.log(s[0])
			console.log(s[1])
			
			// if there is a current model hide it
			if(this.selected !== false) {
				this.get(this.selected).set({ selected : false});
			}

			// if model exists show it
			if(existingModel) {
				// if exists get model
				existingModel.set({selected:true});
				this.selected = detailUID;
				return;
			} 

			// else create model
			if(s[1] === 'null' || s[1] === '' || s[1] === undefined){
				// load home page
				console.log('home');
				model.set({
					title		: 'Onside home',
					type		: 'home',
					originUId	: selectedItemUID,
					channels	: on.m.app.channels.toJSON()
				});
				self.createModel(model);

			} else if(s[0] === 'search'){
				var author = this.app.get('searchModel');
				
				function setSearchModel(){
					model.set({
						originUId	: selectedItemUID,
						type 		: s[0],
						title 		: author.escape('title'),
						events 		: author.get('events'),
						channels 	: author.get('channels'),
						articles	: author.get('articles')
					});
					self.createModel(model);
				};
				
				if(author === null){
					author = new BB.Search();
					author.query = s[1];
					author.fetch({
						success:function(){
							setSearchModel();
						}
					});
				}else{
					setSearchModel();
				}
			} else if(s[0] === 'channel' || s[0] === 'event') {
				model.set({
					type : s[0]
				})
				model.fetch({
					success:function(){
						self.createModel(model);
					}
				});
			} else {
				console.error('unknown detail item - ' + selectedItemUID)
			}
		},
		createModel: function(model){
			console.info('createModel')
			this.selected = model.id;
			
			model.set({
				channelJson	: model.get('channels'),
				channels	: new BB.ChannelList(this.app),

				eventJson	: model.get('events'),
				events		: new BB.EventList(this.app),

				articleJson	: model.get('articles'),
				articles	: new BB.ArticleList(this.app)
			});
			
			this.add(model);
		}
	});
	
	var CommentList = Backbone.Collection.extend({
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
			_.bindAll(this, 'updateCollection');
			this.app.bind('change:selectedItemUID', this.updateCollection);
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
		model : BB.tweet,
		hash: false,

		url : function(){
			if(!this.hash) return;
			return '/tweet/' + this.hash.replace('#','');
		},
		parse: function(resp, xhr){
			this.refreshUrl = resp.refresh_url;
			return resp.results;
		}
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
