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
			
			// BIND: if model.app.currentList changes this view will get updated
			this.app.bind('change:currentList', this.updateView);
			
			// create initial channel + event lists. Order > in dom / local storage / ajax / websocket
			var channelList = new ChannelListView({ collection: on.c.defaultChannels, app: this.options.app });
			var eventList = new EventListView({ collection: on.c.defaultEvents, app: this.options.app });
	
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
			
			this.app.set({currentList: val });
		},
		
		updateView: function(){
			console.log('* View.Nav.updateView');
			
			switch(this.app.get('currentList')){
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
					console.error('!! view.NavView.updateView: this.app.get(currentList) value = ' + this.app.get('currentList'))
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
			//console.log('ListView.confirm = collection.all')
		},
		
		addOne: function(item){
			//console.log('ListView.addOne = collection.add')
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
			
			this.app.bind('change:currentListItem', this.updateItem)
			
		},
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		},
		updateItem: function(){
			var path = this.app.get('currentList') + ':' + this.model.get('UID');
			
			if(path === this.app.get('currentListItem')){
				$(this.el).addClass('active');
			}else{
				$(this.el).removeClass('active');
			}
		},
		selectItem: function(e){
			e.preventDefault();
			
			console.log('click')
			
			var id = $(e.currentTarget).find('h1').attr('data-id'),
				path = this.app.get('currentList') + ':' + id;
	
			this.app.set({currentListItem:path});
			this.app.set({currentModel:this.model});
		}
	});
	var ChannelView 	= _ListItemView.extend({
		className:'channelItem',
		//template: _.template($('#channelListTemplate').html()),
		template: _.template("<h1 data-id='{{UID}}'>{{name}}</h1>")
	});
	var EventView 		= _ListItemView.extend({
		className:'eventItem',
		template: _.template("<h1 data-id='{{UID}}'>{{name}}</h1>")
	});
	
	// click channel/event, add model to DetailList.collection
	// collection.bind('add')
	// model = detail collection or event - all required meta data, get articles, get related events/channels/etc!
	var DetailView 		= Backbone.View.extend({
		tagName: 'article',
		className: 'detailItem',
		
		events: {
			//'click .refresh'	: 'refresh',
			//'click .home'		: 'goHome'
		},
		
		initialize: function(){
			console.info('# View.Detail.initialize')
			this.app = this.options.app;
			//this.model = this.options.app.get('currentModel');

			_.bindAll(this, 'updateModel');
			
			// BIND: if model.app.currentModel changes this view will get updated
			this.app.bind('change:currentModel', this.updateModel);
		},
		
		resetView: function(){},
		
		updateModel: function(){
			var type = this.options.app.get('currentModel').get('type');

			console.log('# Detail.updateModel: type = ' + type);
			
			// switches on type, could specifically look for data properties so less dependent
			switch ( type ){
				case 'channel':
					// show Articles
					break;
				case 'event':
					break;
				case 'event:match':
				case 'event:league':
					break;
				default:
					console.error( 'View.Detail.updateModel: this.model.get(type) = '+this.model.get('type') );
					break;
			}
			
		}
	});
	// possibly sub parts to detail View;
	
	var ArticleListView = Backbone.View.extend({
		// el : $('#listArticle'),
		// collection : BB.ArticleList(),
		// initialize: function(){}
		
	});
	var ArticleView 	= Backbone.View.extend({});
	
	// on.m.app.change, CommentList.reset()
	var CommentListView = Backbone.View.extend({});
	var CommentView 	= Backbone.View.extend({});
	
	// Assign private var to namespace (_var only used as base for other objects)
	BB.AppView 			= AppView;		
	BB.NavView 			= NavView;
	//BB.ChannelListView 	= ChannelListView;
	//BB.EventListView 	= EventListView;
	//BB.ChannelView 		= ChannelView;
	//BB.EventView 		= EventView;
	BB.DetailView 		= DetailView;
	//BB.ArticleListView 	= ArticleListView;
	//BB.ArticleView 		= ArticleView;
	//BB.CommentListView 	= CommentListView;
	//BB.CommentView 		= CommentView;
	
})(this.BB);

