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
		
	var ArticleList = Backbone.Collection.extend({
		model : BB.Article,
		url: on.path.api + '/article',
		parse: function(resp, xhr) {
			return resp.resultset.articles;
		},
		comparator : function(Article) {
			var P = Article.get("publish"),
				D = new Date(P.replace(' ', 'T'));
			return - D.getTime();
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
			_.bindAll(this, 'manageCollection', 'create', 'checkSetCreate');
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
			var c = new BB.ChannelList(),
				e = new BB.EventList(),
				a = new BB.ArticleList();

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
					on.helper.log('//////////////////////// author unknown')

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
					on.helper.log('//////////////////////// author')
					on.helper.log(author)
					self.createModel( selectedItemUID, detailUID, author);
				}
			};
			
			// if current model selected, change to hidden
			if(this.selected !== false) {
				this.get(this.selected).set({ selected : false});
			}

			// service, but no item selected stop.
			if(s[1] === 'null') return;
						
			if(existingModel) {
				// if exists get model
				existingModel.set({selected:true});
				this.selected = detailUID;
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
	BB.DetailList = DetailList;
	BB.ArticleList = ArticleList;
	BB.CommentList = CommentList;
	BB.ChatList = ChatList;
	
})(this.BB);
