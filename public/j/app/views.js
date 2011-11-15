var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Views

(function(BB){
		
	var AppView 		= Backbone.View.extend({
		el: $('#OnsideApp'),
		
		events: {
			'resize' 			: 'onResize',
			'click .login' 		: 'login',
			'submit #search' 	: 'search'
		},
		
		initialize: function(){
			console.info('# View.Appview.initialize');
			this.app = this.options.app;
		},
		
		search: function(){},
		
		login: function(){
			// show lightbox / options
			// use chooses, auths, returns to page
			// I update a number of APP params including URL, change URL 		
		},
		
		onResize : function(e){
			console.log('App.onResize')
			var $el = $('#OnsideApp'),
				w = $el.width(),
				h = $el.height(),
				c;
			
			if(w >= 1024){c='size_full';
			}else if(w >=640 && w< 1024){c="size_med";
			}else if(w < 640){c="size_min";				
			}else{c="unknown";}
			c = (w < h)? c+' landscape' : c+' portrait';
			$el.attr('class',c);
			
			$('.page').each(function(){
				var $p = $(this),
					$c = $('section.content',$p),
					c = $c.height(),
					h = $('header',$p).height() | 0, 
					f = $('footer',$p).height() | 0,
					nh = $p.height() - h - f;
					
				$c.css('height', nh)
			});
			
		}
	});
	
	var NavView 		= Backbone.View.extend({
		el: $('#listGroups'),
		
		events: {
			'click .toggleList'		: 'changeGroup',
			'click .toggleSize'		: 'expandContainer',
			'click .toggleBlock'	: 'toggleBlocks'
		},
		
		initialize: function(){
			console.info('# View.Nav.initialize');
			
			this.app = this.options.app;
			this.$eventButton = this.$('.toggleList .event');
			this.$channelButton = this.$('.toggleList .channel');
			
			_.bindAll(this, 'updateView', 'changeGroup', 'toggleBlocks');
			
			// BIND: if model.app.currentListName changes this view will get updated
			this.app.bind('change:currentListName', this.updateView);
			
			// create initial channel + event lists. Order > in dom / local storage / ajax / websocket
			var channelList = new ChannelListView({ collection: this.app.channels, app: this.options.app }),
				eventList = new EventListView({ collection: this.app.events, app: this.options.app });
	
			// commonly
			this.$channels = $(channelList.el);
			this.$events = $(eventList.el);
			this.$content = this.$('.content');
		},
		
		toggleBlocks: function(e){
			e.preventDefault();
			console.log('! click.toggleBlock => View.Nav.toggleBlocks');
			
			var h = e.target.getAttribute('href');
				block = $(h),
				allBlocks = $('.block').not('#navSearch');
			
			if(block.is(':hidden')){
				allBlocks.hide(200);
				block.show(200);
			}else{
				block.hide(100)
			}
			

		},
		
		changeGroup: function(e){
			e.preventDefault();
			console.log('! click.toggleGroup => View.Nav.changeGroup');
	
			var c = e.target.className,
				val = (c.indexOf('event') === -1)? 'channel' : 'event';
			
			this.app.set({currentListName: val });
		},
		
		updateView: function(){
			console.log('* View.Nav.updateView');
			
			switch(this.app.get('currentListName')){
				case 'event':
				case 'events':
					this.$content.append(this.$events);
					this.$channels.detach();
					this.$eventButton.addClass('on');
					this.$channelButton.removeClass('on');
					break;
					
				case 'channel':
				case 'channels':
					this.$content.append(this.$channels);
					this.$events.detach();
					this.$channelButton.addClass('on');
					this.$eventButton.removeClass('on');
					break;
				
				default:
					console.error('!! view.NavView.updateView: this.app.get(currentList) value = ' + this.app.get('currentListName'))
					break;
			}
		},
		
		expandContainer: function(){
			console.log('* View.Nav.expandContainer')
		}
		
	});
	
	// List Views for left nav
	var _ListView 		= Backbone.View.extend({
		tagName: 'div',
		
		initialize: function(){
			this.app = this.options.app;
			_.bindAll(this, 'addOne', 'addAll', 'confirm')

			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			this.collection.bind('all', this.confirm);
		},
		
		confirm: function(){
			// nothing to do
		},
		
		addOne: function(item){
			// overwritten in extended object
		},
		
		addAll: function(){
			console.log('# ListView.addAll = collection.reset // className = ' + this.className);
			this.collection.each(this.addOne);
		}
		
	});
	var ChannelListView = _ListView.extend({
		className: 'channelList',
		addOne: function(channel){
	//		console.log('=> View.ChannelListView.addOne');
			var view = new ChannelView({model:channel, app:this.options.app})
			$(this.el).append(view.render().el);
		}
	});
	var EventListView 	= _ListView.extend({
		className: 'eventList',
		addOne: function(event){
	//		console.log('=> View.EventListView.addOne');
			var view = new EventView({model:event, app:this.options.app})
			$(this.el).append(view.render().el);
		}
	});
	
	// Item views for left nav
	var _ListItemView 	= Backbone.View.extend({
		tagName: 'article',
	
		events: {
			'click' : 'selectItem'
		},
	
		initialize: function(){
			this.app = this.options.app;
			_.bindAll(this, 'render', 'updateItem');
			this.app.bind('change:currentItemCid', this.updateItem)
		},
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		},
		updateItem: function(){
			if( this.model.cid === this.app.get('currentItemCid')){
				$(this.el).addClass('active');
				this.model.selected = true;
			}else if ( this.model.selected ){
				$(this.el).removeClass('active');
			}
		},
		selectItem: function(e){
			e.preventDefault();			
			console.log('click')
			
			var id = $(e.currentTarget).find('h1').attr('data-id'),
				path = this.app.get('currentList') + ':' + id;

			this.app.set({
				currentItemCid	: this.model.cid,
				currentList 	: this.model.name,
				currentModel 	: this.model
			});
		}
	});
	var ChannelView 	= _ListItemView.extend({
		className:'channelItem',
		template: _.template( $('#channelListTemplate').html() )
	});
	var EventView 		= _ListItemView.extend({
		className:'eventItem',
		template: _.template( $('#eventListTemplate').html() )
	});
	
	var DetailListView 	= Backbone.View.extend({
		// manage multiple detail views and navigating between / transitions + pre load and get next at top or bottom
		el: $('#detailArticle'),

		events: {
			//'click .refresh'	: 'refresh',
			//'click .home'		: 'goHome'
		},

		initialize: function(){
			console.info('# View.Detail.initialize')
			
			this.app = this.options.app;
			this.collection = this.app.detailedList;

			_.bindAll(this, 'addOne', 'addAll', 'removeOne', 'show');
			
			// BIND Collection
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			this.collection.bind('remove', this.removeOne);
			
			//this.app.bind('change:currentItemCid', this.show);
		},
		
		addOne: function(model){
			console.log('View.DetailList.addOne');
			var view = new DetailView({model:model, app:this.options.app});
			model.view = view.render().el;
		},
		addAll: function(models){
			console.log('View.DetailList.addAll');
		},
		removeOne: function(){
			console.log('View.DetailList.removeOne');
		},
		show: function(){
			console.log('View.DetailList.show');
			var cid = this.app.get('currentItemCid'),
				model = this.collection.getByCid(cid);
			//t = this.collection
			console.log(this.collection)
			console.log(model)
			console.log(cid)
			
			t = model;
			//console.log(this.collection)
			//this.el.append(view.render().el);
			
		}
	});

	var DetailView		= Backbone.View.extend({
		tagName: 'article',
		className: 'detailItem',
		template: _.template( $('#detailTemplate').html() ),
		events: function(){},
		
		initialize: function(){
			_.bindAll(this, 'render');
		},
		
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
			var view = new ArticleListView({ model: this.model });
			$(this.el).append(view.el);
			
		    return this;
		}
	});

	var ArticleListView = Backbone.View.extend({
		tagName: 'section',
		className: 'content',
		initialize: function(){
			console.log('# View.ArticleList.initialize');
			_.bindAll(this, 'addAll', 'addOne');
			
			this.collection = new BB.ArticleList();
			this.collection.bind('reset', this.addAll);
			this.collection.bind('add', this.addOne);

			this.collection.fetchRSS({
				keywords : this.model.get('keywords')
			})

		},
		
		addAll: function(){
			this.collection.each(this.addOne);
		},
		addOne: function(article){
			var view = new ArticleView({model:article});
			$(this.el).append(view.render().el);
		}
	});
	
	var ArticleView 	= Backbone.View.extend({
		tagName: 'article',
		template: _.template( '<h2>{{title}}</h2>' ),
//		template: _.template( $('#articleTemplate').html() ),
		
		initialize: function(){
			console.info('# View.Article.initialize')
			_.bindAll(this, 'render');
		},
		
		render: function(){
			console.log(this.model.toJSON())
			
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		}
	});
	
	var ArticleDetailView = Backbone.View.extend({
		el: $('#detailArticle'),
		template: $('#articleDetail'),
		
		initialize: function(){
			_.bindAll(this, 'render')
		},
		
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		}
		
	});
	
	var iframeView		= Backbone.View.extend({});
	
	
	// on.m.app.change, CommentList.reset()
	var CommentListView = Backbone.View.extend({});
	var CommentView 	= Backbone.View.extend({});
	
	// Assign private var to namespace (_var only used as base for other objects)
	BB.AppView 			= AppView;		
	BB.NavView 			= NavView;
	//BB.ChannelListView = ChannelListView;
	//BB.EventListView 	= EventListView;
	//BB.ChannelView 	= ChannelView;
	//BB.EventView 		= EventView;
	BB.DetailListView 	= DetailListView;
	//BB.ArticleListView 	= ArticleListView;
	//BB.ArticleView 		= ArticleView;
	//BB.CommentListView 	= CommentListView;
	//BB.CommentView 		= CommentView;
	
})(this.BB);

