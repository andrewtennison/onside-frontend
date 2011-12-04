var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Views

(function(BB){
		
	var AppView 		= Backbone.View.extend({
		el: $(window),
		
		events: {
			'click .login' 		: 'login'
		},
		
		initialize: function(){
			on.helper.log('# View.Appview.initialize', 'info');

			_.bindAll(this, 'onResize');
			this.app = this.options.app;

			$(window).bind('resize', this.onResize);
			this.onResize();
		},
				
		login: function(){
			// show lightbox / options
			// use chooses, auths, returns to page
			// I update a number of APP params including URL, change URL 		
		},
		
		onResize : function(e){
			on.helper.log('App.onResize')
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
					
				//$c.css('height', nh)
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
			on.helper.log('# View.Nav.initialize', 'info');
			
			this.app = this.options.app;
			this.$eventButton = this.$('.toggleList .event');
			this.$channelButton = this.$('.toggleList .channel');
			
			_.bindAll(this, 'updateView', 'changeGroup', 'toggleBlocks');
			
			// BIND: if model.app.selectedServiceName changes this view will get updated
			this.app.bind('change:selectedServiceName', this.updateView);
			
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
			on.helper.log('! click.toggleBlock => View.Nav.toggleBlocks');
			
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
			on.helper.log('! click.toggleGroup => View.Nav.changeGroup');
	
			var c = e.target.className,
				val = (c.indexOf('event') === -1)? 'channel' : 'event';
			
			this.app.set({selectedItemUID: val + '|null' });
		},
		
		updateView: function(){
			on.helper.log('* View.Nav.updateView');
			
			switch(this.app.get('selectedServiceName')){
				case 'event':
				case 'events':
					this.$content.append(this.$events);
					this.$channels.detach();
					this.$eventButton.addClass('on');
					this.$channelButton.removeClass('on');
					break;
					
				case 'channel':
				case 'channels':
				//case 'savedSearch':
					this.$content.append(this.$channels);
					this.$events.detach();
					this.$channelButton.addClass('on');
					this.$eventButton.removeClass('on');
					break;
				
				default:
					on.helper.log('!! view.NavView.updateView: this.app.get(selectedServiceName) value = ' + this.app.get('selectedServiceName'), 'error')
					break;
			}
		},
		
		expandContainer: function(){
			on.helper.log('* View.Nav.expandContainer')
		}
		
	});

	var SearchView 		= Backbone.View.extend({
		el: $('#navSearch > form'),
		
		events: {
			'focus input[name="q"]' 	: 'focus',
			'blur input[name="q"]' 		: 'blur',
			'submit'					: 'submit'
		},
		
		initialize : function(){
			this.app = this.options.app;
			_.bindAll(this, 'search');
		},
		
		focus: function(){
			on.helper.log('focus')
		},
		blur: function(){
			on.helper.log('blur')
		},
		submit: function(e){
		    e.preventDefault();
		    var escVal = on.helper.esc($('input[name="q"]').val());
		    this.search(escVal);
		},
		search: function(value){
			var self = this,
				model = new BB.Search();
				
			model.query = value;
			model.fetch({
				success:function(searchModel){
					console.info(searchModel)
					self.app.set({
						searchModel 		: searchModel,
						selectedItemUID		: searchModel.service +'|'+value
					});
				},
				error:function(){alert('search failed')}
			})
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
			on.helper.log('# ListView.addAll = collection.reset // className = ' + this.className);
			this.collection.each(this.addOne);
		}
		
	});
	var ChannelListView = _ListView.extend({
		className: 'channelList',
		addOne: function(channel){
	//		on.helper.log('=> View.ChannelListView.addOne');
			var view = new ChannelView({model:channel, app:this.options.app})
			$(this.el).append(view.render().el);
		}
	});
	var ChannelListDetailView = ChannelListView.extend({
		tagName: 'section',
		className: 'content channelList',
		addOne: function(channel){
			var view = new ChannelDetailView({model:channel, app:this.options.app}),
				render = view.render().el;
			
			$(this.el).append(render);
		}
	});
	var EventListView 	= _ListView.extend({
		className: 'eventList',
		addOne: function(event){
	//		on.helper.log('=> View.EventListView.addOne');
			var view = new EventView({model:event, app:this.options.app})
			$(this.el).append(view.render().el);
		}
	});
	var EventListDetailView = EventListView.extend({
		tagName: 'section',
		className: 'content eventList',
		addOne: function(event){
			var view = new EventDetailView({model:event, app:this.options.app})
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
			this.app = on.m.app;//this.options.app;
			_.bindAll(this, 'render', 'updateItem');
			this.app.bind('change:selectedItemUID', this.updateItem)
		},
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		},
		updateItem: function(){
			if( (this.model.get('service') + '|' + this.model.id) === this.app.get('selectedItemUID')){
				$(this.el).addClass('active');
				this.model.selected = true;
			}else if ( this.model.selected ){
				$(this.el).removeClass('active');
				this.model.selected = false;
			}
		},
		selectItem: function(e){
			e.preventDefault();			
			on.helper.log('! View.listItem.selectItem => click');

			this.app.set({
				selectedItemUID		: this.model.get('service') + '|' + this.model.id,
				// selectedItemCid		: this.model.cid,
				// selectedServiceName : this.model.get('service'),
				selectedModel 		: this.model
			});
		}
	});
	var ChannelView 	= _ListItemView.extend({
		className:'channelItem',
		template: _.template( $('#channelItemTemplate').html() )
	});
	var ChannelDetailView 	= ChannelView.extend({
		template: _.template( $('#channelDetailItemTemplate').html() )
	});
	var EventView 		= _ListItemView.extend({
		className:'eventItem',
		template: _.template( $('#eventItemTemplate').html() )
	});
	var EventDetailView = EventView.extend({
		template: _.template( $('#eventDetailItemTemplate').html() )
	});
	
	// Detail views
	var DetailListView 	= Backbone.View.extend({
		// manage multiple detail views and navigating between / transitions + pre load and get next at top or bottom
		el: $('#listDetail'),

		events: {
			//'click .refresh'	: 'refresh',
			//'click .home'		: 'goHome'
		},

		initialize: function(){
			on.helper.log('# View.Detail.initialize', 'info')
			
			this.app = this.options.app;
			this.collection = this.app.detailedList;

			_.bindAll(this, 'addOne', 'addAll', 'removeOne');
			
			// BIND Collection
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			this.collection.bind('remove', this.removeOne);
		},
		
		addOne: function(model){
			on.helper.log('# View.DetailList.addOne');
			var view = new DetailView({model:model, app:this.options.app});
			this.el.append(view.render().el);

			// set page route
			var s = model.get('originUId').split('|'),
				route = s[0] + "/" + s[1];
			this.app.route.navigate(route);
		},
		addAll: function(models){
			on.helper.log('View.DetailList.addAll');
		},
		removeOne: function(){
			on.helper.log('View.DetailList.removeOne');
		}
	});
	var DetailView		= Backbone.View.extend({
		tagName: 'article',
		className: 'detailItem',
		template: _.template( $('#detailTemplate').html() ),
		events: {
			'click .save': 'saveAction'
		},
		
		initialize: function(){
			on.helper.log('# View.Detail.initialize', 'info');
			_.bindAll(this, 'render', 'toggleDisplay', 'saveAction', 'toggleButton');
			this.app = this.options.app;
			this.model.bind('change:selected', this.toggleDisplay);
			this.model.bind('change:saved', this.toggleButton);
			
			this.toggleButton();
		},
		
		render: function(){
			on.helper.log('# View.Detail.render');
			on.helper.log(this.model.toJSON());

			$(this.el).html(this.template(this.model.toJSON()));
			
			var viewC = new ChannelListDetailView({ collection: this.model.get('channels') }),
				viewE = new EventListDetailView({ collection: this.model.get('events') }),
				viewA = new ArticleListView({ collection: this.model.get('articles') });

			$(this.el).find('.contentWrapper')
				.append(viewC.el)
				.append(viewE.el)
				.append(viewA.el);

			this.model.getContent();
		    return this;
		},
		
		toggleDisplay: function(){
			if(this.model.get('selected')) {
				$(this.el).show();
			}else{
				$(this.el).hide();
			}
		},
		toggleButton: function(){
			if(this.model.get('saved')) {
				this.$('a.save').text('remove').attr('data-action','remove');
			}else{
				this.$('a.save').text('save').attr('data-action','save');
			}
		},
		saveAction: function(e){
			e.preventDefault();
			var that = this,
				OUID = this.model.get('originUId').split('|'),
				saved = this.model.get('saved'),
				title = this.model.get('title');
			
			switch(OUID[0]){
				case 'search':
					if(saved) return;
					
					var url = on.path.api + '/search/save';
					$.post(url, {
						query:title,
						name:title
					}, function(res){
						on.helper.log(res);
						that.model.set({saved:true});
					})
					break;
				case 'channel':
					if(saved){
						// saved, so un-save
						var url = on.path.api + '/channel/unfollow';
						$.post(url, {
							channel:OUID[1]
						},function(res){
							on.helper.log(res)
							//  that.model.set({saved:res.saved}); - once saved is setup, needs to be added to backend
							that.model.set({saved:false});
						})
					}else{
						// if not saved, then save
						var url = on.path.api + '/channel/follow';
						$.post(url,{
							channel: OUID[1]
						}, function(res){
							on.helper.log(res)
							//  that.model.set({saved:res.saved}); - once saved is setup
							that.model.set({saved:true});
						})
					}
					break
				case 'event':
					break;
				default:
					on.helper.log('DetailView.save failed service = ' + this.model.get('service'), 'error')
					break;
			}
		}
	});

	// Article views
	var ArticleListView = Backbone.View.extend({
		tagName: 'section',
		className: 'content articleList',
		initialize: function(){
			on.helper.log('# View.ArticleList.initialize');
			_.bindAll(this, 'addAll', 'addOne');
			
			this.collection.bind('reset', this.addAll);
			this.collection.bind('add', this.addOne);

			//this.collection.fetch();
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
		template: _.template( $('#articleTemplate').html() ),
		twitterTemplate: _.template( $('#articleTemplate-twitter').html() ),
		youtubeTemplate: _.template( $('#articleTemplate-youtube').html() ),
		
		events: {
			'click a.fullArtilce':'openIframe'
		},
		
		initialize: function(){
			_.bindAll(this, 'render');
		},
		
		render: function(){
			//if(this.model.get('original')) { on.helper.log( eval( "(" + this.model.get('original') + ")" ) ) };

			var json = this.model.toJSON(),
				type = json.type;
			
			switch(type){
				case 'twitter':
					$(this.el).html(this.twitterTemplate(json));
					break;
				case 'youtube':
					json.videoId = json.link.substring(json.link.lastIndexOf('/') + 1,json.link.length)
					$(this.el).html(this.youtubeTemplate(json));
					break;
				case 'rss':
				default:
					$(this.el).html(this.template(json));
					break;
			};
			$(this.el).addClass(type);
			
		    return this;
		},
		
		openIframe: function(e){
			e.preventDefault();
			var url = this.model.get('link'),
				view = new iframeView({model:this.model});

			on.helper.log(url)
			$('body').append(view.render().el);	
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
	
	var iframeView		= Backbone.View.extend({
		tagName: 'section',
		className: 'iframe',
		template: _.template( $('#iframeTemplate').html() ),
		events: {
			'click .close'	: 'remove'
		},
		initialize: function(){
			_.bindAll(this, 'render' ,'remove');
		},
		render: function(){
			on.helper.log(this.model.toJSON())
			$(this.el).html(this.template( this.model.toJSON() ));
			return this;
		},
		remove: function(){
			$(this.el).remove();
			$(this.el).unbind();
			return false;
		}
	});
	
	// Comment views
	var CommentPostView = Backbone.View.extend({
		el: $('#listChat form'),
		
		events: {
			'focus input[name="comment"]' 	: 'focus',
			'blur input[name="comment"]' 	: 'blur',
			'submit'						: 'submit'
		},
		
		initialize : function(){
			this.app = this.options.app;
			this.collection = this.app.comments;
			//_.bindAll(this, 'updatePostParams');
		},
		
		focus: function(){
			on.helper.log('focus')
		},
		blur: function(){
			on.helper.log('blur')
		},
		submit: function(e){
		    e.preventDefault();
		    		    
		    var selectedItemUID = this.app.get('selectedItemUID'),
	    		UID = selectedItemUID.split('|'),
		    	val = this.$('input#commentAdd').val(),
		    	postParams = {comment:val};
		    
		    if(UID[1] === 'null') {
		    	alert('please select a channel first');
		    	return;
		    }
		    
		    postParams[UID[0]] = UID[1];
			this.collection.urlParams = '';
		    this.collection.create(postParams);
		    this.$('input[name="comment"]').val('');
		}
		
	});	
	var CommentListView = Backbone.View.extend({
		el : $('#listChat > .content'),
		initialize: function(){
			this.app = this.options.app;
			_.bindAll(this, 'addOne', 'addAll');
			
			this.collection = this.app.comments;
			
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);

		},
		
		addOne: function(comment){
			var view = new CommentView({model:comment, app:this.options.app})
			$(this.el).append(view.render().el);
		},
		addAll: function(comment){
			this.el.empty();
			this.collection.each(this.addOne);
		}
		
	});
	var CommentView 	= Backbone.View.extend({
		tagName: 'article',
		className: 'comment',
		template:  _.template( $('#commentTemplate').html() ),
		initialize: function(){
			_.bindAll(this, 'render');
		},
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		}
	});
	
	// Assign private var to namespace (_var only used as base for other objects)
	BB.AppView 			= AppView;		
	BB.NavView 			= NavView;
	BB.SearchView		= SearchView;
	BB.DetailListView 	= DetailListView;
	BB.CommentPostView 	= CommentPostView; 
	BB.CommentListView 	= CommentListView; 

})(this.BB);

