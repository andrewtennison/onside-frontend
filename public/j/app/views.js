var on = window.on || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Views

on.AppView = Backbone.View.extend({
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

on.NavView = Backbone.View.extend({
	el: $('#listGroups'),
	
	events: {
		'click .toggle': 'changeGroup'
	},
	
	initialize: function(){
		console.info('# View.Nav.initialize');
		
		this.app = this.options.app;
		this.$eventButton = this.$('.toggle .event');
		this.$channelButton = this.$('.toggle .channel');
		
		_.bindAll(this, 'updateView', 'changeGroup');
		this.app.bind('change:currentList', this.updateView);
		
		on.v.channelList = new on.ChannelListView({ collection: on.c.defaultChannels, app: this.options.app });
		on.v.eventList = new on.EventListView({ collection: on.c.defaultEvents, app: this.options.app });

		this.$channels = $(on.v.channelList.el);
		this.$events = $(on.v.eventList.el);
		this.$content = this.$('.content');
	},
	
	changeGroup: function(e){
		e.preventDefault();
		console.log('! click.toggle => View.Nav.changeGroup');

		var c = e.target.className,
			val = (c.indexOf('event') === -1)? 'channel' : 'event';
		
		this.app.set({currentList: val });
	},
	
	updateView: function(){
		console.log('* View.Nav.updateView');
		
		if(this.app.get('currentList') === 'event'){
			this.$content.append(this.$events);
			this.$channels.detach();
			this.$eventButton.addClass('on');
			this.$channelButton.removeClass('on');
		}else{
			this.$content.append(this.$channels);
			this.$events.detach();
			this.$channelButton.addClass('on');
			this.$eventButton.removeClass('on');
		}


	}
	
});

var ListView = Backbone.View.extend({
	tagName: 'div',
	
	initialize: function(){
//		console.info('# View.ChannelListView.Initiaize');
		
		this.app = this.options.app;
		_.bindAll(this, 'addOne', 'addAll', 'confirm')

		this.collection.bind('add', this.addOne);
		this.collection.bind('reset', this.addAll);
		this.collection.bind('all', this.confirm);
		
	},
	
	confirm: function(){
		console.log('Channel = add all')
	},
	
	addOne: function(item){},
	
	addAll: function(){
		console.log('# ListView.addAll');
		this.collection.each(this.addOne);
	}
	
});
on.ChannelListView = ListView.extend({
	className: 'channelList',
	addOne: function(channel){
//		console.log('=> View.ChannelListView.addOne');
		var view = new on.ChannelView({model:channel, app:this.options.app})
		$(this.el).append(view.render().el);
	}
});
on.EventListView = ListView.extend({
	className: 'eventList',
	addOne: function(event){
//		console.log('=> View.EventListView.addOne');
		var view = new on.EventView({model:event, app:this.options.app})
		$(this.el).append(view.render().el);
	}
});

var ListItemView = Backbone.View.extend({
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
on.ChannelView = ListItemView.extend({
	className:'channelItem',
	//template: _.template($('#channelListTemplate').html()),
	template: _.template("<h1 data-id='{{UID}}'>{{name}}</h1>")
});
on.EventView = ListItemView.extend({
	className:'eventItem',
	template: _.template("<h1 data-id='{{UID}}'>{{name}}</h1>")
});

on.DetailView = Backbone.View.extend({
	initialize: function(){
		console.info('# View.Detail.initialize')
	}
});
// possibly sub parts to detail View;

on.ArticleListView = Backbone.View.extend({});
on.ArticleView 	= Backbone.View.extend({});

on.CommentListView = Backbone.View.extend({});
on.CommentView 	= Backbone.View.extend({});

