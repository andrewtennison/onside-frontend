var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Collections

(function(BB){

	var _Lists = Backbone.Collection.extend({
		// overiden in extended objects
		defaultUrl:'', 
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
			this.app = app;
			_.bindAll(this, 'manageCollection', 'create', 'checkSetCreate');
			this.bind('add', this.manageCollection);
			this.app.bind('change:selectedItemUID', this.checkSetCreate)
		},
		manageCollection: function(){
			// possibly delete old if too many - manage memory
			// console.log(this)
		},
		createModel: function(selectedItemUID, ID){
			console.info('# Collection.DetailList.create - ' + ID)
//			console.info(obj)

			var s = selectedItemUID.split('|');
			if(s[1] === 'null') return;

			var thisModel = {
				id		 	: ID,
				originUId	: selectedItemUID,
				selected	: true,
				channels 	: new ChannelList(),
				events 		: new EventList(),
				articles 	: new ArticleList(),
			};


			switch (s[0].toLowerCase()){
				case 'channel':
				case 'event':
					var author = (s[0] === 'channel')? this.app.channels.get(s[1]) : this.app.events.get(s[1]);
					console.log(author.toJSON());

					thisModel.channels.url = on.path.api + '/channel?' + s[0] + '=' + s[1];
					thisModel.events.url = on.path.api + '/event?' + s[0] + '=' + s[1];
					thisModel.articles.url = on.path.api + '/article?' + s[0] + '=' + s[1];

					thisModel.author = author.toJSON();
					thisModel.title = author.get('name');
					thisModel.getContent = function(){
						thisModel.events.fetch();
						thisModel.channels.fetch();
						thisModel.articles.fetch();
					};
					
					//_.extend(obj, thisModel);
					this.add(thisModel);
					return thisModel;

					break;
				case 'search':
					var author = this.app.get('searchModel');
					
					thisModel.author = author.toJSON();
					thisModel.type = author.get('type');
					thisModel.title = author.escape('title');
					thisModel.getContent = function(){
						thisModel.events.reset(author.get('events'));
						thisModel.channels.reset(author.get('channels'));
						thisModel.articles.reset(author.get('articles'));
					}
					
					this.add(thisModel);
					return thisModel;
					
					break;
				default:
					console.error('# Collection.DetailList.Create: unknown service = ' + service);
					return;	
				
			}
		},
		checkSetCreate: function(){
			/* if selectedItemUID (channel|2) - has service + value
			 *
			 */
			
			var selectedItemUID = this.app.get('selectedItemUID'),
				s = selectedItemUID.split('|'),
				detailUID = 'detail|' + selectedItemUID,
				existingModel = this.get( detailUID );
			
			// if current model selected, change to hidden
			if(this.selected !== false) {
				this.get(this.selected).set({ selected : false});
			}

			// service, but no item selected stop.
			if(s[1] === 'null') return;
						
			if(existingModel) {
				// if exists get model
				existingModel.set({selected:true});
			} else {
				// else create model
				this.createModel( selectedItemUID, detailUID );
			};
			this.selected = detailUID;
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
			this.app = app;
			_.bindAll(this, 'updateCollection');
			this.app.bind('change:selectedItemUID', this.updateCollection);
		},
		updateCollection: function(){
			var s = this.app.get('selectedItemUID').split('|');
			
			this.reset();
			if(s[1] === 'null') {
				console.error('Model.App.updateComments - selectedItemUID = ' + s[0] +'|'+ s[1] );
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
