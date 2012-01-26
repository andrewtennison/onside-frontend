var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Views
/*

AppView					- "window" > manages main app functions
NavView					- "#listGroups" > manage left navigation lists
SearchView				- "#navSearch" > search form

_ListView				- base object
	_ListView.ChannelListView		- left nav channel list
	_ListView.EventListView			- left nav event list
	_ListView.SavedSearchListView	- left nav search list

_ListItemView			- base object
	_ListItemView.ChannelView		- left nav channel item
	_ListItemView.EventView			- left nav event item
	_ListItemView.SaveSearchView	- left nav search item

## List view in detail items
ChannelListView.ChannelListDetailView	- detail item > channel list
EventListView.EventListDetailView		- detail item > event list

ChannelView.ChannelDetailView			- detail item > channel item
ChannelView.ChannelDetailHomeView		- detail item > channel home item
EventView.EventDetailView				- detail item > event item

## Detail views
DetailListView			- "#listDetail" > detail list
DetailView				- detail item 

ArticleListView			- detail item > article list
ArticleView				- base object + article item view
	ArticleView.ArticleView_twitter
	ArticleView.ArticleView_youtube
	ArticleView.ArticleView_rss

ArticleDetailView		- "#listArticle" > overlay articles list

ADIV				- base for Article overlays
ADIV.ADIV_iframe			- article iframe overlay
ADIV.ADIV_youtube		- article youtube overlay
ADIV.ADIV_twitter		- article twitter overlay

CommentPostView		- post comment form
CommentListView		- list comments + manage tabs
CommentView			- individual comment 
TweetView			- individual tweet comment


 */


(function(BB){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BASE OBJECTS ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var ev = {};
	_.extend(ev, Backbone.Events);

	var _form = Backbone.View.extend({
		events: {
			'focus input.formEl' 	: 'focus',
			'blur input.formEl' 	: 'blur',
			'submit'				: 'submit'
		},
		escapeValue: true,
		initialize : function(){
			this.app = this.options.app;
			_.bindAll(this, 'submit', 'search');
		},
		focus: function(){
			on.helper.log('focus')
		},
		blur: function(){
			on.helper.log('blur')
		},
		submit: function(e){
		    e.preventDefault();
			var escVal = (this.escapeValue)? on.helper.esc($(this.el).serialize()) : $(this.el).serialize();
			this.search(escVal);
		},
		search: function(value){
		}		
	});
	
	var _ListView 		= Backbone.View.extend({
		tagName: 'div',
		title: {
			auth: false,
			unauth: false
		},
		initialize: function(){
			this.app = this.options.app;
			if(this.options.type) this.type = this.options.type;

			_.bindAll(this, 'addOne', 'addAll', 'addHelp');

			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
		},
		addOne: function(item){
			// overwritten in extended object
		},
		addHelp: function(){
			// overwritten in extended object
		},
		
		addAll: function(){
			on.helper.log('# ListView.addAll = collection.reset // className = ' + this.className);
			$(this.el).empty();

			/* set title */
			var userAuth = (this.app)? this.app.get('userAuth') : null;
			if(this.title.auth && userAuth) {
				$(this.el).prepend('<h2 class="groupTitle">'+this.title.auth+'</h2>');
			} else if(this.title.unauth/* && userAuth*/){
				$(this.el).prepend('<h2 class="groupTitle">'+this.title.unauth+'</h2>');
			};
			
			if(this.collection.length === 0){
				this.addHelp();
			}else{
				this.collection.each(this.addOne);
			}
				
		}
		
	});

	var _ListItemView 	= Backbone.View.extend({
		tagName: 'article',
	
		events: {
			'click' : 'selectItem'
		},
		initialize: function(){
			this.app = this.options.app;
			_.bindAll(this, 'render', 'updateItem', 'selectItem');
			this.app.bind('change:selectedItemUID', this.updateItem)
		},
		render: function(){
			$(this.el).html(this.template( this.model.toJSON() ));
		    return this;
		},
		updateItem: function(appModel,val){
			if( (this.model.get('service') + '|' + this.model.id) === val){
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
			
			$('#main').attr('class', false);
			
			this.app.set({
				selectedItemUID		: this.model.get('service') + '|' + this.model.id,
				selectedItemTitle	: this.model.get('name') || this.model.get('title')
			});
		}
	});
	
	var _ArticleView 	= Backbone.View.extend({
		tagName: 'article',
		
		events: {
			'click .open'			: 'select',
			'mouseenter'			: 'hoverOver',
			'mouseleave'			: 'hoverOut',
			'click .filter'			: 'toggleFilters',
			'click .filters a'		: 'filterCollection'
		},
		
		initialize: function(){
			_.bindAll(this, 'render', 'select', 'preSelect', 'hoverOver', 'hoverOut', 'filterCollection', 'setDisplay');
			this.app = this.options.app;
			this.model.bind('change:filtered', this.setDisplay);
			this.model.collection.bind('change:filter', this.updateFilters);
		},
		
		render: function(){
			var json = this.model.toJSON();
			if(!json.filtered) $(this.el).addClass('hidden');
			$(this.el).html(this.template(json));
		    return this;
		},
		
		setDisplay: function(){
			if(this.model.get('filtered')) {
				$(this.el).removeClass('hidden');
			}else{
				$(this.el).addClass('hidden');
			}
		},
		preSelect: function(){},
		select: function(e){
			e.preventDefault();
			this.preSelect();
			this.app.set({
				selectedArticle		: this.model.id,
				selectedItemTitle	: this.model.get('name') || this.model.get('title')
			});
		},
		hoverOver: function(){ $(this.el).addClass('on'); },
		hoverOut: function(){
			$(this.el).removeClass('on').removeClass('showFilter');
			//this.$('.filters').removeClass('on');
		},
		toggleFilters: function(e){
			e.preventDefault();
			//this.$('.filters').toggleClass('on');
			$(this.el).toggleClass('showFilter');
		},
		filterCollection: function(e){
			e.preventDefault();

			var $el = $(e.target),
				attr = e.target.className.replace('f_',''),
				val = $('span', $el).text();
			
			if(this.$('.filters a').not($el).hasClass('on')){
				this.$('.filters a').not($el).removeClass('on')
			}
			
			if($el.hasClass('on')){
				$el.removeClass('on');
				this.model.collection.myFilter(attr);
			}else{
				$el.addClass('on');
				this.model.collection.myFilter(attr,val);
			}

			
		}
	});

	_HelpView = Backbone.View.extend({
		tagName: 'article',
		className: 'help',
		events: {
			'click .help' : 'hide'
		},

		template	: _.template( $('#help_defaultTemplate').html() ),
		
		templates: {
			// left nav helpers
			navChannel				: _.template( $('#help_navChannelTemplate').html() ),
			navEvent				: _.template( $('#help_navEventTemplate').html() ),
			navSearch				: _.template( $('#help_navSearchTemplate').html() ),
			
			// detail item helpers
			// detail type=home
			detailHomeChannel		: _.template( $('#help_detailHomeChannelTemplate').html() ),
			
			// detail type=search
			detailSearchChannel		: _.template( $('#help_detailSearchChannelTemplate').html() ),
			detailSearchEvent		: _.template( $('#help_detailSearchEventTemplate').html() ),
			detailSearchArticle		: _.template( $('#help_detailSearchArticleTemplate').html() ),

			// detail type=channel / event
			detailDefaultChannel	: _.template( $('#help_detailDefaultChannelTemplate').html() ),
			detailDefaultEvent		: _.template( $('#help_detailDefaultEventTemplate').html() ),
			detailDefaultArticle	: _.template( $('#help_detailDefaultArticleTemplate').html() ),
			
			// comment helpers
			commentOnside			: _.template( $('#help_commentOnsideTemplate').html() ),
			commentFacebook			: _.template( $('#help_commentFacebookTemplate').html() ),
			commentTwitter			: _.template( $('#help_commentTwitterTemplate').html() ),
			commentGoogle			: _.template( $('#help_commentGoogleTemplate').html() ),
		},
		
		initialize: function(){
			_.bindAll(this, 'render', 'hide');
		},	
		render: function(name){
			// console.info(name)
			// console.info(this.templates)
			// console.info(this.templates[name])
			if(this.templates[name]){
				$(this.el).html(this.templates[name]());
			}else{
				$(this.el).html(this.template());
			}
		    return this;
		},
		hide: function(e){
			e.preventDefault();
			$(this.el).slideUp(200);
		}
	});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN views ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var AppView 		= Backbone.View.extend({
		el: $(window),
		currentShow: false,
		
		$el: {
			app: $('#OnsideApp')
		},
		
		events: {
			'click .login'	: 'login',
			'click .show'	: 'triggerShow',
			'click .triggerSearch' : 'triggerSearch'
			//'click triggerFeedback' : open feedback form
			//triggerAddChannel
			//triggerAddSource
		},
		
		initialize: function(){
			on.helper.log('# View.Appview.initialize', 'info');
			
			_.bindAll(this, 'onResize', 'show', 'setAuth', 'triggerShow', 'triggerSearch');
			this.app = this.options.app;

			$(window).bind('resize', this.onResize);
			this.onResize();
			
			this.app.bind('change:userAuth', this.setAuth);
			this.setAuth(false,this.app.get('userAuth'));
		},
				
		login: function(){
			// show lightbox / options
			// use chooses, auths, returns to page
			// I update a number of APP params including URL, change URL 		
		},
		
		setAuth: function(obj,val){
			if(val){
				$(this.el).addClass('auth').removeClass('unAuth');
			} else {
				$(this.el).addClass('unAuth').removeClass('auth');
			}
		},
		triggerShow: function(e){
			e.preventDefault();
			var id = $(e.target).attr('href').replace('#','');
			this.show('show'+id, false);
		},
		show: function(newShow, force){
			var oldShow = this.currentShow;
				
			if(oldShow === newShow && !force){
				this.$el.app.removeClass(oldShow);
				this.currentShow = false;
			}else if( !oldShow ){
				this.$el.app.addClass(newShow);
				this.currentShow = newShow;
			}else{
				this.$el.app.removeClass(oldShow);
				this.$el.app.addClass(newShow);
				this.currentShow = newShow;
			}
		},
		
		onResize : function(e){
			on.helper.log('App.onResize')
			/*
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
			*/
		},
		triggerSearch: function(e){
			e.preventDefault();

			this.show('showchannels', true);

			$('#groupSearch')
			.addClass('flash')
			.animate({'delay':1},500, function(){
				$(this).removeClass('flash').focus();	
			});
		}
	});
	
	var NavView 		= Backbone.View.extend({
		el: $('#listGroups'),
		scroll: null,
		events: {
			'click nav .channels'	: 'changeGroup',
			'click nav .events'		: 'changeGroup',
			'click .toggleSize'		: 'expandContainer',
			'click .toggleBlock'	: 'toggleBlocks'
		},

		initialize: function(){
			on.helper.log('# View.Nav.initialize', 'info');
			
			this.app = this.options.app;
			this.$eventButton = this.$('nav .events');
			this.$channelButton = this.$('nav .channels');
			
			_.bindAll(this, 'updateView', 'changeGroup', 'toggleBlocks', 'updateScroll');
			
			// create initial channel + event lists. Order > in dom / local storage / ajax / websocket
			var channelList = new ChannelListView({ collection: this.options.app.channels, app: this.options.app }),
				eventList = new EventListView({ collection: this.app.events, app: this.options.app }),
				searchList = new SavedSearchListView({ collection: this.app.searches, app: this.options.app });
	
			// commonly
			this.$channels = $(channelList.el);
			this.$events = $(eventList.el);
			this.$searches = $(searchList.el);
			this.$content = this.$('.content');
			
			ev.bind('update:navContent', this.updateScroll, this);
			ev.trigger('update:navContent');

			// BIND: if model.app.selectedServiceName changes this view will get updated
			this.app.bind('change:selectedServiceName', this.updateView);
			
		},
		
		updateScroll: function(){
			var self = this;
			setTimeout(function () {
				var needsScroll = (self.$('#groupContentWrap').height() >= self.$('#groupContentWrap > .scroller').height())? false : true,
					scroll = (self.scroll === null)? false : true;
				
				if(needsScroll && scroll){
					self.scroll.refresh();
				} else if(needsScroll && !scroll){
					self.scroll = new iScroll('groupContentWrap', {hScroll:false, zoom: false, scrollbarClass: 'navScrollbar'});
				} else if (!needsScroll && scroll){
					self.scroll.destroy();
					self.scroll = null;
				}
			}, 100);
		},
		
		toggleBlocks: function(e){
			e.preventDefault();
			on.helper.log('! click.toggleBlock => View.Nav.toggleBlocks');
			
			var el = $(e.target),
				h = e.target.getAttribute('href');
				block = $(h),
				allBlocks = $('.block').not('#navSearch');
			
			if(block.is(':hidden')){
				//allBlocks.hide(200);
				block.slideDown(200);
				el.addClass('active');
			}else{
				block.slideUp(100)
				el.removeClass('active');
			}
			

		},
		
		changeGroup: function(e){
			e.preventDefault();
			on.helper.log('! click.toggleGroup => View.Nav.changeGroup');
	
			var c = e.target.className,
				val = (c.indexOf('event') === -1)? 'channels' : 'events';
			
			this.app.set({
				selectedItemUID		: val + '|null',
				selectedItemTitle	: 'Onside Home'	
			});
		},
		
		updateView: function(){
			on.helper.log('* View.Nav.updateView');
			switch(this.app.get('selectedServiceName')){
				case 'event':
				case 'events':
					this.$content.append(this.$events);
					this.$channels.detach();
					this.$searches.detach();
					this.$eventButton.addClass('active');
					this.$channelButton.removeClass('active');
					break;
					
				case 'channel':
				case 'channels':
				case 'search':
					this.$content.append(this.$channels);
					this.$content.append(this.$searches);
					this.$events.detach();
					this.$channelButton.addClass('active');
					this.$eventButton.removeClass('active');
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

	var SearchView 		= _form.extend({
		el: $('#navSearch > form'),
		initialize : function(){
			this.app = this.options.app;
			_.bindAll(this, 'submit', 'search');

			// hack to fix iScroll focus issue
			var selectField = document.getElementById('groupSearch');
			selectField.addEventListener(on.env.touchClick, function(e) { e.stopPropagation() }, false);
		},
		search: function(value){
			var self = this,
				model = new BB.Search();
				
			model.query = value.replace('q=','');
			model.fetch({
				success:function(searchModel){
					console.info(searchModel)
					self.app.set({
						searchModel 		: searchModel,
						selectedItemUID		: searchModel.service +'|'+value,
						selectedItemTitle	: searchModel.title
					});
				},
				error:function(){console.error('search failed')}
			})
		}
		
	});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Left navigation views ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Left Nav
	// List Views for left nav
	var ChannelListView = _ListView.extend({
		className: 'channelList',
		title: {
			auth: 'Your channels',
			unauth: 'Popular channels'
		},
		addOne: function(channel, index){
			var view = new ChannelView({model:channel, app:this.options.app})
			$(this.el).append(view.render().el);
			if(index === this.collection.length - 1) ev.trigger('update:navContent');
		},
		addHelp: function(){
			var view = new _HelpView();
			$(this.el).append(view.render('navChannel').el);
			ev.trigger('update:navContent');
		}
	});
	var EventListView 	= _ListView.extend({
		className: 'eventList',
		title: {
			auth: 'Your events',
			unauth: 'Popular events'
		},
		addOne: function(event, index){
			var view = new EventView({model:event, app:this.options.app})
			$(this.el).append(view.render().el);
			if(index === this.collection.length - 1) ev.trigger('update:navContent');
		},
		addHelp: function(){
			var view = new _HelpView();
			$(this.el).append(view.render('navEvent').el);
			ev.trigger('update:navContent');
		}
	});
	var SavedSearchListView = _ListView.extend({
		className: 'searchList',
		title: {
			auth: 'Your saved searches',
			unauth: 'Popular searches'
		},
		addOne: function(search, index){
			var view = new SaveSearchView({model:search, app:this.options.app});
			$(this.el).append(view.render().el);
			if(index === this.collection.length - 1) ev.trigger('update:navContent');
		},
		addHelp: function(){
			var view = new _HelpView();
			$(this.el).append(view.render('navSearch').el);
			ev.trigger('update:navContent');
		}
	});
	
	// Item views for left nav
	var ChannelView 	= _ListItemView.extend({
		className:'channelItem bb',
		template: _.template( $('#channelItemTemplate').html() )
	});
	var EventView 		= _ListItemView.extend({
		className:'eventItem bb',
		template: _.template( $('#eventItemTemplate').html() )
	});
	var SaveSearchView 	= _ListItemView.extend({
		className:'searchItem bb',
		template: _.template( $('#savedSearchTemplate').html() ),
		selectItem: function(e){
			e.preventDefault();
			on.helper.log('! View.listItem.selectItem => click');
			this.app.set({
				selectedItemUID		: this.model.get('service') + '|' + this.model.get('query'),
				selectedItemTitle	: this.model.get('name') || this.model.get('title')
			});
		}
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Detail View ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Detail List views
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
			
			//this.app.bind('change:selectedItemUID', this.collection.checkSetCreate)
			
		},
		
		addOne: function(model){
			on.helper.log('# View.DetailList.addOne');
			var view = new DetailView({model:model, app:this.options.app});
			this.el.append(view.render().el);
			
			setTimeout(function () {
				view.scroll = new iScroll(view.baseID, {scrollbarClass: 'detailScrollbar', zoom:false});
			}, 100);

			// set page route
			var s = model.get('originUId').split('|'),
				route = '/' + s[0] + "/" + s[1];
				
			if(s[1] !== 'null') this.app.route.navigate(route);
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
		baseID: 'detailContentWrap',
		template: _.template( $('#detailTemplate').html() ),
		errorTemplate: _.template( $('#detail404Template').html() ),
		events: {
			'click a.save': 'saveAction'
		},
		
		initialize: function(){
			on.helper.log('# View.Detail.initialize', 'info');
			_.bindAll(this, 'render', 'toggleDisplay', 'saveAction', 'toggleButton');
			this.app = this.options.app;

			this.baseID += '_' + this.model.cid;
			this.model.bind('change:selected', this.toggleDisplay);
			this.model.bind('change:saved', this.toggleButton);
			this.toggleButton();
		},
		
		render: function(){
			on.helper.log('# View.Detail.render');
			
			var json = this.model.toJSON();
			
			if(json.error) {
				$(this.el).html(this.errorTemplate(json));
				return this;
			};
			
			$(this.el).html(this.template(json));
			this.$('.contentWrapper').attr({id: this.baseID});

			this.viewC = new ChannelListDetailView({ collection: this.model.get('channels'), app: this.options.app, type: this.model.get('type') }),
			this.viewE = new EventListDetailView({ collection: this.model.get('events'), app: this.options.app, type: this.model.get('type') }),
			this.viewA = new ArticleListView({ collection: this.model.get('articles'), app: this.options.app, type: this.model.get('type') });

			this.app.set({selectedArticleList:this.viewA.collection});

			$(this.el).find('.contentWrapper > .scroller') 
				.append(this.viewC.el)
				.append(this.viewE.el)
				.append(this.viewA.el);
			
			this.model.refresh();

		    return this;
		},
		
		toggleDisplay: function(){
			var self = this;
			if(this.model.get('selected')) {
				this.app.set({selectedArticleList:this.viewA.collection});
				$(this.el).fadeIn(200,function(){
					self.scroll = new iScroll(self.baseID, {hScroll:false, zoom: false, scrollbarClass: 'detailScrollbar'});
				});
			}else{
				$(this.el).fadeOut(200,function(){
					if(self.scroll) {
						self.scroll.destroy();
						self.scroll = null;
					}
				});
			}
		},
		toggleButton: function(){
			if(this.model.get('saved')) {
				this.$('a.save').addClass('active');	//.text('remove').attr('data-action','remove');
			}else{
				this.$('a.save').removeClass('active');	//.text('save').attr('data-action','save');
			}
		},
		saveAction: function(e){
			e.preventDefault();
			var that = this,
				OUID = this.model.get('originUId').split('|'),
				saved = this.model.get('saved') || this.app.channels.get(this.model.id),
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
						that.app.searches.fetch();
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
							that.app.channels.fetch();
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
							that.app.channels.fetch();
						})
					}
					break
				case 'event':
				default:
					on.helper.log('DetailView.save failed service = ' + this.model.get('service'), 'error')
					break;
			}
		}
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Detail View Lists ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// List views for related items in detail view
	var ChannelListDetailView = _ListView.extend({
		tagName: 'section',
		className: 'content channelList',
		title: { auth: 'Related channels', unauth: 'Related channels' },
		addOne: function(channel){
			var view = ( channel.get('defaultArticle') )? new ChannelDetailHomeView({model:channel, app:this.options.app}) : new ChannelDetailView({model:channel, app:this.options.app}),
				render = view.render().el;
			
			$(this.el).append(render);
		},
		addHelp: function(){
			var view = false, name = false;
			switch(this.type){
				case 'search':
					view = new _HelpView();
					name = 'detailSearchChannel';
					break;
				case 'channel':
				case 'event':
					view = new _HelpView();
					name = 'detailDefaultChannel';
					break;
				case 'home':
					view = new _HelpView();
					name = 'detailHomeChannel';
				default:
					break;
			};
			if(view) $(this.el).append(view.render(name).el);
		}

	});
	var EventListDetailView = EventListView.extend({
		tagName: 'section',
		className: 'content eventList',
		msg:{ empty: '<p>This channel has no associated events</p>', low: false },
		title: { auth: false, unauth: false },
		addOne: function(event){
			var view = new EventDetailView({model:event, app:this.options.app})
			$(this.el).append(view.render().el);
		},
		addHelp: function(){
			var view = false, name = false;
			switch(this.type){
				case 'search':
					view = new _HelpView();
					name = 'detailSearchEvent';
					break;
				case 'channel':
				case 'event':
					view = new _HelpView();
					name = 'detailDefaultEvent';
					break;
				case 'home':
				default:
					break;
			};
			if(view) $(this.el).append(view.render(name).el);
		}
	});

	var ArticleListView = Backbone.View.extend({
		tagName: 'section',
		className: 'content articleList',
		initialize: function(){
			on.helper.log('# View.ArticleList.initialize');
			_.bindAll(this, 'addAll', 'addOne', 'addHelp');
			
			this.type = this.options.type;
			this.app = this.options.app;
			this.collection.bind('reset', this.addAll);
			this.collection.bind('add', this.addOne);
		},
		
		addAll: function(){
			if(this.collection.length === 0) {
				this.addHelp()
			}else{
				this.collection.each(this.addOne);
			};
		},
		addOne: function(article){
			var view = false,
				json = article.toJSON(),
				type = json.type;

			switch(type){
				case 'twitter':
					view = new ArticleView_twitter({model:article, app:this.app});
					break;
				case 'youtube':
					var vidId = json.link.substring(json.link.lastIndexOf('/') + 1,json.link.length)
					article.set({videoId:vidId}) ;
					view = new ArticleView_youtube({model:article, app:this.app});
					break;
				case 'rss':
					view = new ArticleView_rss({model:article, app:this.app});
					break;
				default:
					console.error('View.ArticleList.addOne - type not recognised = ' + type)
			};
			if(!view) return;
			
			$(this.el).append(view.render().el);
		},
		addHelp: function(){
			var view = false, name = false;
			switch(this.type){
				case 'search':
					view = new _HelpView();
					name = 'detailSearchArticle';
					break;
				case 'channel':
				case 'event':
					view = new _HelpView();
					name = 'detailDefaultArticle';
					break;
				case 'home':
				default:
					break;
			};
			if(view) $(this.el).append(view.render(name).el);
		}
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Detail List Items ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Item view for related items in detail view
	var ChannelDetailView 	= ChannelView.extend({
		template: _.template( $('#channelDetailItemTemplate').html() )
	});
	var ChannelDetailHomeView = ChannelView.extend({
		className:'channelHomeItem',
		template: _.template( $('#channelDetailHomeItemTemplate').html() ),
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		}
	});
	var EventDetailView = EventView.extend({
		template: _.template( $('#eventDetailItemTemplate').html() )
	});
	
	

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Article item views ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var ArticleView_twitter = _ArticleView.extend({
		className: 'twitter',
		template: _.template( $('#articleTemplate-twitter').html() ),
	});
	var ArticleView_youtube = _ArticleView.extend({
		className: 'youtube',
		template: _.template( $('#articleTemplate-youtube').html() ),
	});
	var ArticleView_rss = _ArticleView.extend({
		className: 'rss',
		template: _.template( $('#articleTemplate').html() ),
		preSelect: function(e){
			var json = this.model.toJSON();
			console.log(json.extended + ' / ' + json.link)
			if(json.extended === null && (/http:\/\//gi).test(json.link)){
				this.model.set({ iframe : true});
			} else if (this.model.get('expand')){
				// if we need to have other types of rss articles we can modify the data on the api and pick it up here
			}
		}
	});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Article Detail Views (overlays) ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var ArticleDetailView = Backbone.View.extend({
		el: $('#listArticle'),
		view: false,
		events: {
			'click .close'	: 'close'
		},
		initialize: function(){
			_.bindAll(this, 'updateView', 'close', 'show', 'hide');
			this.app = this.options.app;
			this.app.bind('change:selectedArticle', this.updateView);
		},
		updateView: function(app, id){
			var oldId = this.app.previous('selectedArticle'),
				s = this.app.get('selectedItemUID').split('|');

			console.log('id = ' + id + ', oldId = '+oldId);

			if(id === oldId){
				return;
			} else if(id === null) {
				this.hide();
				// set page route
				var route = '/' + s[0] + "/" + s[1];
				this.app.route.navigate(route);
			} else {
				var list = this.app.get('selectedArticleList'),
					model = list.get(id),
					view = this.selectView(model);
				
				this.view = view.render().el;
				$(this.el).append(this.view);
				this.show();
				
				// set page route
				var route = '/' + s[0] + "/" + s[1] + '/article-' + model.id;
				this.app.route.navigate(route);
			}
		},
		selectView: function(model){
			var type = model.get('type');
			switch(type){
				case 'twitter':
					return new ADIV_twitter({model:model});
					break;
				case 'youtube':
					return new ADIV_youtube({model:model});
					break;
				case 'rss':
					return (model.get('iframe'))? new ADIV_iframe({model:model}) : new ADIV({model:model});
			};
		},
		close: function(e){
			e.preventDefault();
			this.app.set({
				selectedArticle		: null,
			});
			this.app.setTitle();
		},
		show: function(){
			$(this.el).addClass('on');
		},
		hide: function(){
			$(this.el).removeClass('on');
			$(this.view).remove();
		}
	});

	// ADIV = ArticleDetailItemView
	var ADIV = Backbone.View.extend({
		tagName: 'article',
		className:'articleDetail',
		template: _.template( $('#articleDetail').html() ),
		render: function(){
			console.log(this.model.toJSON())
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		}
	});
	
	var ADIV_iframe = ADIV.extend({
		className:'articleIframe',
		template: _.template( $('#articleDetail_iframe').html() )
	});

	var ADIV_youtube = ADIV.extend({
		className:'articleYoutube',
		template: _.template( $('#articleDetail_youtube').html() )
	});

	var ADIV_twitter = ADIV.extend({
		className:'articleTwitter',
		template: _.template( $('#articleDetail_twitter').html() )
	});

	
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Comment views ///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	var CommentPostView = _form.extend({
		el: $('#onsideComments form'),
		escapeVal: false,
		initialize : function(){
			_.bindAll(this, 'submit', 'search');
			this.app = this.options.app;
			this.collection = this.options.collection;
		},
		search: function(value){
			console.log(value)
			
		    var UID = this.app.get('selectedItemUID').split('|'),
		    	val = value.split('=')[1];
		    	postParams = {comment: val};
		    
		    if(UID[1] === null) return;
		    
		    postParams[UID[0]] = UID[1];
			this.collection.urlParams = '';
		    this.collection.create(postParams);
		    this.$('input[name="comment"]').val('');
		}
	});
	var TweetPostView = _form.extend({
		escapeValue: false,
		el: $('#twitterComments form'),
		escapeValue: false,
		initialize : function(){
			_.bindAll(this, 'submit', 'search', 'updateContent');
			this.app = this.options.app;
			this.collection = this.options.collection;
			var twit = this.app.get('twitter');
			this.$('button').text('tweet now @'+ twit.screen_name);
			this.escapeValue = false;
		},
		search: function(){
			var value = this.$('#tweetAdd').val(),
				self = this,
				params = { message: value.replace('tweet=','') };
				
			$.post('/tweet', params, function(res){
				console.log(res);
				self.collection.add(res);
			});
			//this.collection.create(params)
		},
		updateContent: function(){
			this.$('textarea').text('#' + this.collection.hash);
		}
	});
	
	var CommentListView = Backbone.View.extend({
		el : $('#listChat'),
		scroll: null,
		
		events: {
			'click nav > a'	: 'changeTab'
		},
		
		defaultTab: false,
		activeTab: false,
		activeBlock: false,
		
		$el: {
			on_block		: this.$('#onsideComments'),
			fb_block		: this.$('#facebookComments'),
			tw_block		: this.$('#twitterComments'),
			go_block		: this.$('#googleComments'),
		},
		
		initialize: function(){
			this.app = this.options.app;
			_.bindAll(this, 'changeTab', 'updateScroll');
			
				// comment lists views
			var onsideComments = new OnsideCommentListView({app: this.options.app, collection:this.app.comments}),
				twitterComments = new TwitterCommentListView({app: this.options.app, collection:this.app.tweets}),
				facebookComments = new FacebookCommentListView({app: this.options.app}),			
				// Post Comment view
				onsideCommentsPost = new CommentPostView({ app: on.m.app, collection:this.app.comments });
			
			this.$('nav a.onside').click();
			
			ev.bind('update:scroll:comments', this.updateScroll, this);
			ev.trigger('update:scroll:comments');
		},
		updateScroll: function(){
			var self = this;
			setTimeout(function () {
				var needsScroll = (self.$('#chatContentWrap').height() >= self.$('#chatContentWrap > .scroller').height())? false : true,
					scroll = (self.scroll === null)? false : true;
				
				if(needsScroll && scroll){
					self.scroll.refresh();
				} else if(needsScroll && !scroll){
					self.scroll = new iScroll('groupContentWrap', {hScroll:false, zoom: false, scrollbarClass: 'commentScrollbar'});
				} else if (!needsScroll && scroll){
					self.scroll.destroy();
					self.scroll = null;
				}
			}, 100);
		},
		changeTab: function(e){
			e.preventDefault();
			var newTab = $(e.target),
				newBlock = newTab.attr('href');
			
			$(this.activeTab).removeClass('active');			
			$(this.activeBlock).removeClass('active');			

			this.activeTab = newTab;
			this.activeBlock = newBlock;

			$(this.activeTab).addClass('active');
			$(this.activeBlock).addClass('active');
			
			if(newBlock === '#facebookComments' && this.$el.fb_block.is(':empty')){
				this.facebookComments();
			}
			ev.trigger('update:scroll:comments');
		}
	});

	var _genericCommentListView = Backbone.View.extend({
		//el : $('#onsideComments'),
		helpGeneral: 'commentOnside',
		helpAuth: 'commentOnside',
		active: false,
		initialize: function(){		
			_.bindAll(this, 'onInit', 'setupComments', 'addOne', 'addAll', 'reset', 'checkContent', 'showHelp', 'createHash');
			
			this.app = this.options.app;
			this.collection = this.options.collection;		
			this.$inner = this.$('.inner');
			this.$form = this.$('form');
			this.$help = false;
			
			this.app.bind('change:selectedItemUID', this.checkContent); 
			this.app.bind('change:selectedArticle', function(){
				var val = this.app.get('selectedItemUID');
				this.checkContent(false, val);
			});

			if(this.collection) {
				this.collection.bind('add', this.addOne);
				this.collection.bind('reset', this.addAll);
			}
			this.onInit();
			console.info('COMMENTS   //')
			console.log(this)
		},
		onInit: function(){},
		setupComments: function(){},
		addOne: function(comment, index){},
		addAll: function(comment){
			this.$inner.empty();
			this.collection.each(this.addOne);
		},
		reset: function(){
			// empty + if present
			this.$form.show();
			this.$inner.empty().show();
			console.log(this.$help);
			if(this.$help) this.$help.remove();
		},
		checkContent: function(model, val){
			this.reset();
			var s = val.split('|');
			if(s[1] === 'null' || s[0 === 'search']){
				// home/search - no comments
				this.showHelp('general');
			}else if(!this.auth){
				// not auth to use this module - login help
				this.showHelp('auth');
			}else{
				this.setupComments(val);
			};
		},
		showHelp: function(type){
			console.log('show help');
			var help = (type === 'general')? this.helpGeneral : this.helpAuth,
				view = new _HelpView();
				
			this.$help = $( view.render(help).el );
			this.el.prepend(view.render(help).el);
			this.$form.hide();
			this.$inner.hide();
			ev.trigger('update:scroll:comments');
		},
		createHash: function(val){
			var s = val.split('|');
			s[0] = s[0].substring(0,1).toUpperCase();
			var hash = 'On' + s[0] + s[1];
			if(s[2]) hash += s[2];
			return hash;
		}
	});
	
	var OnsideCommentListView = _genericCommentListView.extend({
		el : $('#onsideComments'),
		onInit: function(){
			this.auth = true;
		},
		addOne: function(comment, index){
			var view = new CommentView({model:comment, app:this.options.app})
			this.$inner.append(view.render().el);
			if(index === this.collection.length - 1) ev.trigger('update:scroll:comments');
		}
	});	
	var TwitterCommentListView = _genericCommentListView.extend({
		el : $('#twitterComments'),
		auth: function(){
			var u = this.app.get('user');
			return (u.twitter && u.twitter.length >= 2)? true : false;
		},
		helpAuth: 'commentTwitter',
		onInit: function(){
			this.postView = new TweetPostView({ app: this.options.app, collection: this.options.collection });
			this.auth = this.app.get('twitter');
		},
		addOne: function(tweet, index){
			var view = new TweetView({model:tweet, app:this.options.app});
			this.$inner.prepend(view.render().el);
			if(index === this.collection.length - 1) ev.trigger('update:scroll:comments');
		},
		setupComments: function(val){
			var hash = this.createHash(val);
			this.collection.hash = hash;
			this.postView.updateContent(hash);
			this.collection.fetch();
		}
	});
	var FacebookCommentListView = _genericCommentListView.extend({
		el : $('#facebookComments'),
		helpAuth: 'commentFacebook',
		onInit: function(){
			this.auth = this.app.get('facebook');
		},
		setupComments: function(val){
			var url = document.location.href.replace('#',''),
				width = '265px', //this.$inner.width(),
				comments = '<input type="hidden" value="'+url+'" /><div class="fb-comments" data-href="'+url+'" data-num-posts="2" data-width="'+width+'" data-colorscheme="dark" css=" '+on.path.facebookCss+' " simple="false"></div>';

			this.$inner.html(comments);
			if (typeof FB  != "undefined"){
			    FB.XFBML.parse(document.getElementById('facebookComments'));
			    ev.trigger('update:scroll:comments');
			}
		}
	});

	var CommentView = Backbone.View.extend({
		tagName: 'article',
		className: 'comment bb',
		template: _.template( $('#commentTemplate').html() ),
		officialTemplate: _.template( $('#officialTweetTemplate').html() ),
		initialize: function(){
			_.bindAll(this, 'render');
		},
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
		    return this;
		}
	});
	var TweetView = CommentView.extend({
		className: 'tweet bb',
		template:  _.template( $('#tweetTemplate').html() ),
		render: function(){
			var json = this.model.toJSON();
			if(typeof json.user === 'object'){
				$(this.el).html(this.officialTemplate(this.model.toJSON()));			
			}else{
				$(this.el).html(this.template(this.model.toJSON()));
			}
		    return this;
		}
	});
	
	// Assign private var to namespace (_var only used as base for other objects)
	BB.AppView 			= AppView;		
	BB.NavView 			= NavView;
	BB.SearchView		= SearchView;
	BB.DetailListView 	= DetailListView;
	BB.ArticleDetailView = ArticleDetailView;
	BB.CommentPostView 	= CommentPostView;
	BB.TweetPostView	= TweetPostView; 
	BB.CommentListView 	= CommentListView; 

})(this.BB);

