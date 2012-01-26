var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Collections

(function(BB){

	var _Lists = Backbone.Collection.extend({
		// overiden in extended objects
		defaultUrl:'',
		initialize:function(){
			on.helper.log('# Collection._Lists.initialize','info');
		}
	});
	
	var ChannelList = _Lists.extend({
		model : BB.Channel,
		url: on.path.api + '/mychannel',
		parse: function(resp, xhr) {
			return resp.resultset.channels;
		}
    });

	var EventList = _Lists.extend({
		model : BB.Event,
		url: on.path.api + '/event',
		parse: function(resp, xhr) {
			return resp.resultset.events;
		}
	});
		
	var SavedSearchList = _Lists.extend({
		model : BB.SavedSearch,
		url: on.path.api + '/search/list',
		parse: function(resp, xhr) {
			return resp.resultset.searches;
		}
    });

	var ArticleList = Backbone.Collection.extend({
		model : BB.Article,
		url: on.path.api + '/article',
		filters:{},
		selectedModel: false,
		parse: function(resp, xhr) {
			return resp.resultset.articles;
		},
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
		model: BB.Detail,
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
			_.bindAll(this, 'manageCollection', 'createModel', 'checkSetCreate');
			this.bind('add', this.manageCollection);
			this.app.bind('change:selectedItemUID', this.checkSetCreate)
		},
		manageCollection: function(){
			// possibly delete old if too many - manage memory
			// on.helper.log(this)
		},
		checkSetCreate: function(){
			var self = this,
				selectedItemUID = this.app.get('selectedItemUID'),
				detailUID = 'detail|' + selectedItemUID,
				s = selectedItemUID.split('|'),
				existingModel = this.get( detailUID ),
				search = (s[0] === 'search')? true : false,
				model = new this.model({id:detailUID});
				
				model.bind('error', function(model,error){
					console.error('error - detailed model does not exist');
				});
				
			console.info(selectedItemUID + ' / ' + detailUID)
			console.info('Detailed Model - check set create')
			console.info('currently Selected = ' + this.selected)
			console.info('exists = ' + existingModel)

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
				model.set({
					title		: 'Onside home',
					type		: 'home',
					originUId	: selectedItemUID,
					channels	: on.m.app.channels.toJSON()
				})
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
