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
		url: on.path.api + '/channel',
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
		comparator: function(){
			// sort models.. by the users default order if available?
		},
		selected: false,
		initialize: function(app){
			on.helper.log('# Collection.DetailList.initialize','info');

			this.app = app;
			_.bindAll(this, 'manageCollection', 'create', 'createHomeModel', 'checkSetCreate');
			this.bind('add', this.manageCollection);
			this.app.bind('change:selectedItemUID', this.checkSetCreate)
		},
		manageCollection: function(){
			// possibly delete old if too many - manage memory
			// on.helper.log(this)
		},
		createModel: function(selectedItemUID, ID, author){
			on.helper.log('# Collection.DetailList.create - ' + ID, 'info')

			var s = selectedItemUID.split('|');
			if(s[1] === 'null') return;
			var c = new BB.ChannelList(this.app),
				e = new BB.EventList(this.app),
				a = new BB.ArticleList(this.app);

			this.selected = ID;
			
			var detailModel = new BB.Detail({
				id		 	: ID,
				originUId	: selectedItemUID,
				selected	: true,
				author		: author.toJSON(),
				channels	: c,
				events 		: e,
				articles 	: a
			});

			switch (s[0]){
				case 'channel':
				case 'event':
					detailModel.set({ title:author.get('name') });
					this.add(detailModel);
					break;
					
				case 'search':
					detailModel.set({
						type 		: author.get('type'),
						title 		: author.escape('title'),
						eventJson 	: author.get('events'),
						channelJson : author.get('channels'),
						articleJson	: author.get('articles')
					});
					this.add(detailModel);
					break;
					
				default:
					on.helper.log('# Collection.DetailList.Create: unknown service = ' + service, 'error');
					return;	
			}
		},
		createHomeModel: function(selectedItemUID, ID){
			on.helper.log('# Collection.DetailList.createHome - ' + ID, 'info')
			var detailModel = new BB.Detail({
				id		 	: ID,
				originUId	: selectedItemUID,
				selected	: true,
				type 		: 'home',
				title 		: 'home',
				// author		: author.toJSON(),
				channels	: this.app.channels,
				// events 		: e,
				// articles 	: a
			});
			//this.add(detailModel);
			//this.selected = ID;
		},
		checkSetCreate: function(){
			/* if selectedItemUID (channel|2) - has service + value
			 *
			 */
			var self = this,
				selectedItemUID = this.app.get('selectedItemUID'),
				s = selectedItemUID.split('|'),
				detailUID = 'detail|' + selectedItemUID,
				existingModel = this.get( detailUID );
			
			function checkAuthor(appCollection, Model){
				var author = self.app[appCollection].get(s[1]);
				if(author === undefined) {
					on.helper.log('//////////////////////// detail.author unknown')

					author = new BB[Model]({id:s[1]});
					author.fetch({
						success:function(model){
							self.createModel( selectedItemUID, detailUID, model);
						},
						error: function(err){
							on.helper.log(err, 'error');
							alert(Model + ' unavailable');						
						}
					});
				}else{
					on.helper.log('//////////////////////// detail.author found')
					on.helper.log(author)
					self.createModel( selectedItemUID, detailUID, author);
				}
			};
			
			// if current model selected, change to hidden
			if(this.selected !== false) {
				this.get(this.selected).set({ selected : false});
			}

			// service, but no item selected stop.
			if(existingModel) {
				// if exists get model
				existingModel.set({selected:true});
				this.selected = detailUID;
			} else if(s[1] === 'null'){
				// home page, no channel or event selected
				this.createHomeModel();
				//return;
				
				
			} else {
				// else create model
				switch(s[0]){
					case 'channel':
						checkAuthor('channels', 'Channel')
						break;
					case 'event':
						checkAuthor('events', 'Event');
						break;
					case 'search':
						var author = this.app.get('searchModel');
						if(author === null || author.get('query') !== s[1]) {
							author = new BB.Search();
							author.query = s[1];
							author.fetch({
								success:function(model){
									self.createModel( selectedItemUID, detailUID, model);
								},
								error:function(){alert('search failed')}
							})
						}else{
							this.createModel( selectedItemUID, detailUID, author);
						}
						break;
					default:
						on.helper.log('Collection.DetailList.checkCreate - service = ' + s[0], 'error');
						return;
				}
			};
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
		initialize: function(app){
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
	var ChatList = Backbone.Collection.extend({});


	// Assign to BB namespace
	BB.ChannelList = ChannelList;
	BB.EventList = EventList;
	BB.SavedSearchList = SavedSearchList;
	BB.DetailList = DetailList;
	BB.ArticleList = ArticleList;
	BB.CommentList = CommentList;
	BB.ChatList = ChatList;
	
})(this.BB);
