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
	
	// Fixes an iscroll bug that prevents inputs being focused
	var scrollFixOnInputs = function(parent){
		var el = $('input[type=text]')
			// selectField.addEventListener(on.env.touchClick, function(e) { e.stopPropagation() }, false);
			// selectField.addEventListener('touchstart', function(e) { e.stopPropagation() }, false);	

	};
	
	var ev = {};
	_.extend(ev, Backbone.Events);

	Backbone.View.prototype.close = function(){
		this.remove();
		this.unbind();
		if (this.onClose){
			this.onClose();
		}
	};
	
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
			var escVal = (this.escapeValue)? on.helper.esc(this.$el.serialize()) : this.$el.serialize();
			this.search(escVal);
		},
		search: function(value){
		}		
	});
	
	var _ListView = Backbone.View.extend({
		tagName: 'div',
		title: false,
		itemView: function(item){
			return new ChannelView({model:item, app:this.options.app}); 
		},
		helpViewTemplate: 'navChannel',
		initialize: function(){
			this.app = this.options.app;
			if(this.options.type) this.type = this.options.type;

			_.bindAll(this, 'onInit', 'addOne', 'addAll', 'addHelp');

			this.collection.on('add', this.addOne);
			this.collection.on('reset', this.addAll);
			this.onInit();
		},
		onInit: function(){},
		addOne: function(item, index){
			var view = this.itemView(item);
			if(!view) { console.error('no view to append'); return; };
			this.activeViews.push(view);
			this.$el.append(view.render().el);
			if(index === this.collection.length - 1) this.updateView() ;
		},
		addHelp: function(){
			var name = (typeof this.helpViewTemplate === 'string')? this.helpViewTemplate : this.helpViewTemplate();
			if( !name ) return;
			var view = new _HelpView();
			this.activeViews.push(view);
			this.$el.append(view.render(name).el);
			this.updateView();
		},
		updateView: function(){
			// runs after last item in collection is added
		},
		addAll: function(){
			on.helper.log('# ListView.addAll = collection.reset // className = ' + this.className);
			this.destroyViews();

			if(this.title) this.$el.prepend('<h2 class="groupTitle">'+this.title+'</h2>');

			if(this.collection.length === 0){
				this.addHelp();
			}else{
				this.collection.each(this.addOne);
			}
		},
		activeViews : [],
		destroyViews : function(){
			$.each(this.activeViews, function(index,view){
				view.close();
			});
			this.activeViews = [];
			this.$el.empty();
		},
		
	});

	var _ListItemView 	= Backbone.View.extend({
		tagName: 'article',
		events: {
			'click' : 'selectItem'
		},
		initialize: function(){
			this.app = this.options.app;
			_.bindAll(this, 'render', 'updateItem', 'selectItem');
			this.app.on('change:selectedItemUID', this.updateItem)
		},
		render: function(){
			this.$el.html(this.template( this.model.toJSON() ));
		    return this;
		},
		updateItem: function(appModel,val){
			if( (this.model.get('service') + '|' + this.model.id) === val){
				this.$el.addClass('active');
				this.model.selected = true;
			}else if ( this.model.selected ){
				this.$el.removeClass('active');
				this.model.selected = false;
			}
		},
		selectItem: function(e){
			e.preventDefault();			
			on.helper.log('! View.listItem.selectItem => click');
			$('#main').attr('class', false);
			this.app.set({
				selectedItemUID		: this.model.get('service') + '|' + this.model.id,
				selectedItemTitle	: this.model.get('name') || this.model.get('title'),
				selectedArticle		: false
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
			this.model.on('change:filtered', this.setDisplay);
			this.model.collection.on('change:filter', this.updateFilters);
		},
		render: function(){
			var json = this.model.toJSON();
			if(!json.filtered) this.$el.addClass('hidden');
			this.$el.html(this.template(json));
		    return this;
		},
		setDisplay: function(){
			if(this.model.get('filtered')) {
				this.$el.removeClass('hidden');
			}else{
				this.$el.addClass('hidden');
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
		hoverOver: function(){ this.$el.addClass('on'); },
		hoverOut: function(){
			this.$el.removeClass('on').removeClass('showFilter');
			//this.$('.filters').removeClass('on');
		},
		toggleFilters: function(e){
			e.preventDefault();
			//this.$('.filters').toggleClass('on');
			this.$el.toggleClass('showFilter');
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
			detail404				: _.template( $('#help_detail404Template').html() ),
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
			if(this.templates[name]){
				this.$el.html(this.templates[name]());
			}else{
				this.$el.html(this.template());
			}
		    return this;
		},
		hide: function(e){
			e.preventDefault();
			this.$el.slideUp(200);
		}
	});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN views ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var AppView = Backbone.View.extend({
		el: $(window),
		currentShow: false,
		
		$elem: {
			app: $('#OnsideApp')
		},
		
		events: {
			'click .login'	: 'login',
			'click .show'	: 'triggerShow',
			'click .triggerSearch' : 'triggerSearch',
			'click .triggerFeedback' : 'triggerFeedback'
		},
		
		initialize: function(){
			on.helper.log('# View.Appview.initialize', 'info');
			var self = this;
			
			_.bindAll(this, 'onResize', 'show', 'setAuth', 'triggerShow', 'triggerSearch', 'triggerFeedback');
			this.app = this.options.app;

			$(window).on('resize', this.onResize);			
			this.app.on('change:userAuth', this.setAuth);
			ev.on('update:view', function(val){
				console.log('ev.bnd.updateView - ' + val) 
				self.show(val,true)
			});

			this.setAuth(false,this.app.get('userAuth'));
			this.onResize();

		},
				
		login: function(){
			// show lightbox / options
			// use chooses, auths, returns to page
			// I update a number of APP params including URL, change URL 		
		},
		setAuth: function(obj,val){
			if(val){
				this.$el.addClass('auth').removeClass('unAuth');
			} else {
				this.$el.addClass('unAuth').removeClass('auth');
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
				this.$elem.app.removeClass(oldShow);
				this.currentShow = false;
			}else if( !oldShow ){
				this.$elem.app.addClass(newShow);
				this.currentShow = newShow;
			}else{
				this.$elem.app.removeClass(oldShow);
				this.$elem.app.addClass(newShow);
				this.currentShow = newShow;
			}
		},
		
		onResize : function(e){
			ev.trigger('update:scroll:comments');
			ev.trigger('update:scroll:nav');
			ev.trigger('update:scroll:detail');
		},
		triggerSearch: function(e){
			e.preventDefault();

			this.show('showchannels', true);

			$('#groupSearch')
			.addClass('flash')
			.animate({'delay':1},500, function(){
				$(this).removeClass('flash').focus();	
			});
		},
		triggerFeedback: function(){
			ev.trigger('open:overlay', false, 'feedback');
		}
	});
	
	var NavView = Backbone.View.extend({
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
			
			_.bindAll(this, 'updateUser', 'updateView', 'changeGroup', 'toggleBlocks', 'updateScroll');
						
			// create initial channel + event lists. Order > in dom / local storage / ajax / websocket
			var myChannels = new ChannelListView({ collection: this.options.app.channels, app: this.options.app }),
				myEvents = new EventListView({ collection: this.app.events, app: this.options.app });
				//mySearches = new SavedSearchListView({ collection: this.app.searches, app: this.options.app });
	
			// commonly
			this.$channels = $(myChannels.el);
			this.$events = $(myEvents.el);
			//this.$searches = $(mySearches.el);
			this.$content = this.$('.content');

			// // first fetch of users content
			myChannels.collection.fetch();
			myEvents.collection.fetch();
			//mySearches.collection.fetch();
			
			ev.on('update:scroll:nav', this.updateScroll, this);
			ev.trigger('update:scroll:nav');

			// BIND: if model.app.selectedServiceName changes this view will get updated
			this.app.on('change:user', this.updateUser);
			this.updateView('channels')
			
		},
		updateUser: function(){
			this.$('.user').html( '<span class="icon user"></span>'+ this.app.get('user').name );
		},
		updateScroll: function(){
			var self = this;
			setTimeout(function () {
				var el = this.$('input[type=text], input[type=password], input[type=search], textarea, select'),
					needsScroll = (self.$('#groupContentWrap').height() >= self.$('#groupContentWrap > .scroller').height())? false : true,
					scroll = (self.scroll === null)? false : true;
				
				if(needsScroll && scroll){
					self.scroll.refresh();
				} else if(needsScroll && !scroll){
					el.on('ontouchstart mousedown touchstart', function(e) { e.stopPropagation() });
					self.scroll = new iScroll('groupContentWrap', {hScroll:false, zoom: false, scrollbarClass: 'navScrollbar', hideScrollbar:true, fadeScrollbar: true});
				} else if (!needsScroll && scroll){
					el.off('ontouchstart mousedown touchstart');
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
			
			//this.app.set({ selectedItemUID : val + '|null' });
			this.updateView(val);
		},
		
		updateView: function(val){
			on.helper.log('* View.Nav.updateView');
			//switch(this.app.get('selectedServiceName')){
			switch(val){
				case 'event':
				case 'events':
					this.$content.append(this.$events);
					this.$channels.detach();
					this.$searches.detach();
					this.$eventButton.addClass('active');
					this.$channelButton.removeClass('active');
					break;
					
				case 'list':
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
			this.updateScroll();
		},
		
		expandContainer: function(){
			on.helper.log('* View.Nav.expandContainer')
		}
		
	});

	var SearchView 		= _form.extend({
		el: $('#navSearch > form'),
		initialize : function(){
			this.escapeValue = false;
			this.app = this.options.app;
			_.bindAll(this, 'submit', 'search');

			scrollFixOnInputs();
		},
		search: function(value){
			this.$el.focus();
			var val = this.$('#groupSearch').val();
			this.app.set({
				selectedItemUID: 'search|' + val
			});
		},
		focus: function(){
			ev.trigger('update:view', 'showchannels');
		},
		blur: function(){ this.$('#groupSearch').val(''); }
	});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Left navigation views ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Left Nav
	// List Views for left nav
	var ChannelListView = _ListView.extend({
		className: 'channelList',
		title: 'Your channels',
		helpViewTemplate: 'navChannel',
		itemView: function(item){ return new ChannelView({model:item, app:this.options.app});  },
		updateView: function(){ ev.trigger('update:scroll:nav'); }
	});
	var EventListView 	= _ListView.extend({
		className: 'eventList',
		title: 'Your events',
		helpViewTemplate: 'navEvent',
		itemView: function(item){ return new EventView({model:item, app:this.options.app});  },
		updateView: function(){ ev.trigger('update:scroll:nav'); }
	});
	var SavedSearchListView = _ListView.extend({
		className: 'searchList',
		title: 'Your saved searches',
		helpViewTemplate: 'navSearch',
		itemView: function(item){ return new SaveSearchView({model:item, app:this.options.app});  },
		updateView: function(){ ev.trigger('update:scroll:nav'); }
	});
	
	// Item views for left nav
	var ChannelView 	= _ListItemView.extend({
		className:'bb navListItem',
		template: _.template( $('#channelItemTemplate').html() )
	});
	var EventView 		= _ListItemView.extend({
		className:'bb navListItem',
		template: _.template( $('#eventItemTemplate').html() ),
		render: function(){
			var json = this.model.toJSON();
			json.participantsObj = $().convertToObject(json.participants);
			this.$el.html(this.template( json ));
		    return this;
		}
	});
	var SaveSearchView 	= _ListItemView.extend({
		className:'bb navListItem',
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
	var DetailListView = Backbone.View.extend({
		// manage multiple detail views and navigating between / transitions + pre load and get next at top or bottom
		el: $('#listDetail'),
		selectedModel : false,

		events: {
			//'click .refresh'	: 'refresh',
			//'click .home'		: 'goHome',
			//'click .next .prev
		},
		initialize: function(){
			on.helper.log('# View.Detail.initialize', 'info')			
			this.app = this.options.app;
			this.collection = this.app.detailedList;

			_.bindAll(this, 'updateView', 'addOne', 'addAll', 'removeOne', 'selectStaticView');
			
			// BIND Collection
			this.collection.on('add', this.addOne);
			this.collection.on('reset', this.addAll);
			this.collection.on('remove', this.removeOne);
			this.collection.on('error', function(){
				console.error('detail list collection')
			});
			this.app.on('change:selectedItemUID', this.updateView)
		},
		updateView: function(app,selectedItemUID){
			this.$el.addClass('loading');
			
			var s = selectedItemUID.split('|'),
				detailUID = 'detail|' + selectedItemUID;
				
			if(s[1] === ('null' || null || 'home' || 'popular')) s[0] = 'list'
			
			// if there is a current model hide it
			if(this.selectedModel !== false) {
				this.collection.get(this.selectedModel).set({ selected : false});
			};

			// if model exists show it
			if( this.collection.get( detailUID ) ) {
				this.collection.get(detailUID).set({selected:true});
				this.selectedModel = detailUID;
				this.$el.removeClass('loading');
			}else{
				this.collection.fetchModel(selectedItemUID, detailUID);
			};
		},
		addOne: function(model){
			console.log('# View.DetailList.addOne');

			this.$el.removeClass('loading');
			ev.trigger('update:view', 'showDetail');
			this.selectedModel = model.id;
			
			var type = ( model.get('form') )? 'form' : model.get('type'),
				view;

			switch(type){
				case 'form':
					view = new Form_StaticView({model:model, app:this.options.app});
					break;
				case 'static':
					var getView = this.selectStaticView( model );
					view = new getView({model:model, app:this.options.app});
//					view = new StaticView({model:model, app:this.options.app});
					break;
				default:
					model.setSaved(this.app);
					view = new DetailView({model:model, app:this.options.app});
					break;
			};
			this.$el.append(view.render().el);
			view.toggleDisplay();
		},
		addAll: function(models){
			console.error('View.DetailList.addAll');
		},
		removeOne: function(){
			console.error('View.DetailList.removeOne');
		},
		selectStaticView: function(model){
			console.info('selectStaticView');
			var view = StaticView,
				type = model.get('type'),
				val = model.get('val');
			
			switch(val){
				case 'welcome':
					view = Welcome_StaticView;
					break;
				case 'create':
					view = Form_StaticView;
					break;
				case 'help':
				default:
					view = StaticView;
					break;
			};
			console.info(view)
			return view;
		}
	});
	
	var StaticView = Backbone.View.extend({
		tagName: 'article',
		className: 'detailItem staticItem',
		baseID: 'detailContentWrap',
		errorTemplate: _.template( $('#detail404Template').html() ),
		templates: {
			help: _.template( $('#static_helpTemplate').html() )
		},
		initialize: function(){
			_.bindAll(this, 'onInit', 'render', 'afterRender', 'toggleDisplay');
			this.app = this.options.app;
			this.baseID += '_' + this.model.get('val');
			this.model.on('change:selected', this.toggleDisplay);
			this.onInit();
		},
		onInit: function(){},
		selectTemplate: function(){
			return this.model.get('val');
		},
		render: function(){
			var view,
				json = this.model.toJSON(),
				tplName = this.selectTemplate();

			if(this.templates[tplName]){
				view = this.templates[tplName];
			}else{
				this.errorView = true;
				view = this.errorTemplate;
			};
			this.$el.html( view( json ) );
			this.$('.contentWrapper').attr({id: this.baseID});
			this.afterRender();
		    return this;
		},
		afterRender: function(){},
		toggleDisplay: function(){
			var self = this,
				el = this.$('input[type=text], input[type=password], input[type=search], textarea, select');
				
			if(this.model.get('selected')) {
				this.$el.fadeIn(200,function(){
					el.on('ontouchstart mousedown touchstart', function(e) { e.stopPropagation() });
					setTimeout(function () {
						self.scroll = new iScroll(self.baseID, {hScroll:false, zoom: false, scrollbarClass: 'navScrollbar', hideScrollbar:false, fadeScrollbar: true});
					},400);
				});
			}else if(this.errorView){
				this.close();
			}else{
				this.$el.fadeOut(200,function(){
					el.off('ontouchstart mousedown touchstart');

					if(self.scroll) {
						self.scroll.destroy();
						self.scroll = null;
					}
				});
			}
		}
	});
	
	var Form_StaticView = StaticView.extend({
		templates: {
			channelCreate : _.template( $('#static_channelCreateTemplate').html() ),
		},
		events: {
			'submit form' : 'submit'
		},
		afterRender: function(){
			this.buildForm();
		},
		selectTemplate: function(val){
			var val = this.model.get('val').toLowerCase();
			return this.model.get('type').toLowerCase() + (val.charAt(0).toUpperCase() + val.slice(1));
		},
		onInit: function(){
			_.bindAll(this, 'formError', 'submit', 'buildForm');
			switch(this.model.get('type')){
				case 'channel': 
					this.collection = this.app.channels;
					this.child = new this.collection.model;
					this.child.on('error', this.formError)
					break;
			}
		},
		formError: function(){},
		submit: function(e){
			e.preventDefault();
			var self = this,
				$form = this.$('form'),
				hash = $form.serializeObject();
				
			var baseHash = {name:"", keywords:"", search_term:"", description:"", sport:"", type:"", hash:"", image:"", level:"", branding:"", geolat:"", geolng:"", status:"active", user:null};
			_.extend(baseHash, hash); 
			
			// this.child.set(hash2);
			this.child.save(baseHash, {
				success:function(res){
					console.log(res.resultset[0]);
					self.collection.add(self.child)
				}, error:function(err){
					console.error(err)
				}
			});
		},
		buildForm: function(){
			var opts = this.child.defaultOptions,
				name = this.model.id.split('|')[3], 
				nameInput = this.$('input[name=name]'),
				key;

			nameInput[0].addEventListener(on.env.touchClick, function(e) { e.stopPropagation() }, false);
			nameInput[0].addEventListener('touchstart', function(e) { e.stopPropagation() }, false);
			nameInput.val(name);
			this.$('input[name=search_term]').val(name);
			for(key in opts){
				if( opts[key].values && _.isArray(opts[key].values) ){
					var string = '',
						el = this.$('select[name='+key+']');
						
					$.each(opts[key].values, function(i,val){
						string += '<option value="'+val+'">'+val+'</option>'
					})
					el.append( $(string) );
				}
			};
		}
	});
	
	var Welcome_StaticView = StaticView.extend({
		stage:0,
		blocks:false,
		currentToggle:false,
		sportsString: '',
		location: false,
		templates: {
			welcome: _.template( $('#static_welcomeTemplate').html() )
		},
		events: {
			'submit #userUpdate'	: 'updateUser',
			'submit #userInterests'	: 'sportsSearch',
			'click .tagList a'		: 'toggleSports',
			'click .next'			: 'getNext',
			'click h2'				: 'getThis',
			'click .triggerFacebook': 'addFacebook',
			'click .triggerTwitter'	: 'addTwitter',
			'click .quickFollowChannel': 'followChannel'
		},
		onInit: function(){
			_.bindAll(this, 'updateUser', 'sportsSearch', 'toggleSports', 'getLocation', 'getNext', 'getThis', 'addFacebook', 'addTwitter', 'followChannel');
			this.model.set({sports:on.settings.sports});
			this.selectedBlock = this.$('.block.on');
			//this.getLocation();
		},
		postUser: function(data, success, error){
			var self = this,
				url = '/api/user/' + this.app.get('user').id;
				
			$.post(url, data).success(function(res){
				var updatedUser = res.resultset.users[0];
				if(updatedUser.password) delete updatedUser.password;
				self.app.set({ user:res.resultset.users[0] });
				success(res);
			}).error(error);
		},
		updateUser: function(){
			var self = this,
				$el = this.$('#userUpdate'),
				$form = $('form', $el),
				data = $form.serializeArray();
			
			if(data.password !== data.confirmPassword) {
				$('h2 span',$el).text('passwords do not match');
				return;
			}
			
			$form.addClass('loadingMask');
			function success(res){
				$form.removeClass('loadingMask');
				$('h2', $el).text('2. Details saved');
				$('a.next', $el).click();
				self.scroll.refresh();
			};
			function error(res){
				console.error(res)
			};

			this.postUser(data, success, error);
			return false;
		},
		toggleSports: function(e){
			e.preventDefault();
			var $el = $(e.target),
				$ch = this.$('.channelsQuickFollow');
			
			if(this.currentToggle === $el){
				$el.removeClass('on');
				this.currentToggle = false;
				return;
			};
			
			if(this.currentToggle) this.currentToggle.removeClass('on');			
			$el.addClass('on');
			this.currentToggle = $el;
			var val = $el.text();
			
			$.get('/api/search?q='+val, function(res){
				$ch.empty();
				var channels = res.resultset.channels,
					string = '';
				
				if(channels.length == 0){
					string += '<p>No channels for this sport yet.. </p>'
				}
				
				$.each(channels, function(i, channel){
					string += '<li><a class="quickFollowChannel" href="#channel/'+channel.id+'" data-id="'+channel.id+'">'+channel.name+'</a></li>';
				});
				$ch.append( $(string) );
			});			
		},
		followChannel: function(e){
			e.preventDefault();
			var $el = $(e.target),
				id = $el.attr('data-id'),
				name = $el.text();
			
			$.post(on.path.api + '/channel/follow', {channel:id})
			.success(function(res){
				console.log(res);
				$el.after( $('<span>following '+name+'</span>') )
				$el.remove();
			})
			.error(function(err){console.error(err)})
			
		},
		sportsSearch: function(){
			alert(this.sportsString)
			this.app.set({
				selectedItemUID: 'search|' + this.sportsString
			});
			return false;
		},
		getLocation: function(){
			var self = this,
				$el = $('#userLocation');
			
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(success, error);
			} else {
				error('not supported');
			};
			
			function success(position){
				if (this.location) return;
				self.location = position.coords;
			};
			function error(msg){
				alert(msg)
			};
		},
		getNext: function(e){
			var self = this,
				button = $(e.target),
				parent = button.closest('.block'),
				next = parent.next('.block');

			if(next.length){
				parent.removeClass('on');
				next.addClass('on');
				this.selectedBlock = next;
				setTimeout(function(){
					self.scroll.refresh();
				},300);
				return false;
			}
		},
		getThis: function(e){
			var title = $(e.target),
				parent = title.closest('.block');
			if(parent.hasClass('on')) {
				parent.removeClass('on');
				parent = false;
			} else {
				parent.addClass('on');
				this.selectedBlock.removeClass('on');
				this.selectedBlock = parent;
			};
		},
		addFacebook: function(e){
			e.preventDefault();
			var self = this,
				button = $(e.target);
			
			if(button.hasClass('laoding')) return;
			
			button.addClass('loading');
			FB.login(function(response) {
				if (response.authResponse) {
					FB.api('/me', function(res) {
						console.log(res);
						var data = self.app.get('user');
						if(!data.name || data.name.length == 0) data.name = res.name; 
						if(!data.facebook || data.facebook.length == 0) data.facebook = res.id; 
						if(!data.avatar || data.avatar.length == 0) data.avatar = 'http://graph.facebook.com/'+res.username+'/picture'; 
						//response.favorite_teams
						
						self.postUser(data, function(res){
							button.after( $('<span>Facebook added</span>') )
							button.remove();
						}, function(res){
							console.error(res)
							button.removeClass('loading');
						});
					});
				} else {
					console.log('User cancelled login or did not fully authorize.');
				};
			});
		},
		addTwitter: function(e){
			e.preventDefault();
			var self = this,
				button = $(e.target);
			
			if(button.hasClass('laoding')) return;
			
			button.addClass('loading');

			function upDateUser(user){
				var data = self.app.get('user');
				if(!data.name || data.name.length == 0) data.name = user.name; 
				if(!data.twitter || data.twitter.length == 0) data.twitter = user.id;
				if(!data.avatar || data.avatar.length == 0) data.avatar = user.profileImageUrl;
				
				self.postUser(data, function(res){
					button.after( $('<span>Twitter added</span>') )
					button.remove();
				}, function(res){
					console.error(res)
					button.removeClass('loading');
				});
			}
			
			twttr.anywhere(function (T) {
				T.bind("authComplete", function (e, user) {
					console.log(T.currentUser)
					upDateUser(T.currentUser)
				});
			    if (T.isConnected()) {
					console.log('auth complete')
					console.log(T.currentUser)
					upDateUser(T.currentUser)
			    } else {
					T.signIn();
			    };
			});			
		}
	});

	var DetailView = Backbone.View.extend({
		tagName: 'article',
		className: 'detailItem',
		baseID: 'detailContentWrap',
		template: _.template( $('#detailTemplate').html() ),
		errorTemplate: _.template( $('#detail404Template').html() ),
		events: {
			'click a.save': 'saveAction',
			'click a.triggerAddChannel': 'createChannel'
		},
		initialize: function(){
			console.info('# View.Detail.initialize');
			_.bindAll(this, 'render', 'toggleDisplay', 'saveAction', 'toggleButton', 'updateScroll', 'createScroll', 'createChannel');
			this.app = this.options.app;
			this.type = this.model.get('type');

			this.baseID += '_' + this.model.cid;
			this.model.on('change:selected', this.toggleDisplay);
			this.model.on('change:saved', this.toggleButton);
			this.toggleButton();

			this.scrollDir = false;
			this.scrollState = false;

			ev.on('update:scroll:detail', this.updateScroll, this);
		},
		render: function(){
			console.log('# View.Detail.render');
			
			var json = this.model.toJSON();
			if(json.error) {
				this.$el.html(this.errorTemplate(json));
				return this;
			};
			
			this.$el.html(this.template(json));
			this.$('.contentWrapper').attr({id: this.baseID});
			this.$el.addClass('type-'+this.type)

			// scroll
			this.pullDownEl = this.$('#pullDown')[0];
			this.pullUpEl = this.$('#pullUp')[0];
			this.pullLoading = false;
			this.pullDownOffset = 48;
			this.pullUpOffset = 48;

			this.viewC = new ChannelListDetailView({ collection: this.model.get('channels'), app: this.options.app, type: this.type });
			this.viewE = new EventListDetailView({ collection: this.model.get('events'), app: this.options.app, type: this.type });
			this.viewA = new ArticleListView({ collection: this.model.get('articles'), app: this.options.app, type: this.type, adverts: json.adverts });

			switch(this.type){
				case 'list':
					var v = this.model.get('val');
					this.viewC.title = false;
					this.viewE.title = false;
					this.viewA.title = false;
					break;
				case 'search':
					this.viewC.title = 'Channels that match your search';
					this.viewE.title = 'Events that match your search';
					this.viewA.title = 'Articles that match your search'; 
					if(this.model.get('articleCount') > 20) this.viewA.title += ', (20 of ' + this.model.get('articleCount')+ ')';
					break;
			}

			this.app.set({selectedArticleList:this.viewA.collection});

			// add html to view
			this.$el.find('.contentWrapper > .scroller > #pullUp')
				.before(this.viewC.el)
				.before(this.viewE.el)
				.before(this.viewA.el);
			
			// update branding
			var hex = this.model.get('author').branding;
			if(hex){
				hex = hex.split(',');
				this.$('.detailHead').css({'background-color':hex[0]});
				if(hex.length == 2) this.$('.detailHead h1').css({'color':hex[1]});
			}
			this.model.refresh();
		    return this;
		},		
		toggleButton: function(){
			if(this.model.get('saved')) {
				this.$('a.save').addClass('active');
			}else{
				this.$('a.save').removeClass('active');
			}
		},
		saveAction: function(e){
			e.preventDefault();
			this.model.follow(this.app);
		},
		pullDownAction: function(){
			//self.channel.fetch({add: true});
			console.log(this);
			var self = this,
				id = this.model.id.split('|'),
				params = id[1] +'='+id[2] + '&' + this.viewA.collection.paginationParams(true);

			this.viewA.collection.params = params;
			this.viewA.collection.fetch({add: false, success:function(){
				self.updateScroll();
			}});
		},
		pullUpAction: function(self){
			var self = this,
				id = this.model.id.split('|'),
				pagination = this.viewA.collection.paginationParams(),
				params = id[1] +'='+id[2] + '&' + pagination;

			this.viewA.collection.params = params;
			this.viewA.collection.fetch({add: true, success:function(){
				var index = pagination.substring( pagination.lastIndexOf('=')+1, pagination.length );
				self.updateScroll(index);
			}});
		},
		updateScroll: function(elementIndex){
			var self = this,
				pageLength = this.$('.contentWrapper').height(),
				contentLength = this.$('.scroller').height();
			
			if(contentLength < pageLength) {
				this.$('.scrollLoad').css('display','none');
				return;
			};

			if( this.$('.scroller').height() < this.$('.contentWrapper').height() ) {
				this.$('.scrollLoad').css('display','none');
				if(this.scroll) {
					this.scroll.destroy();
					this.scroll = null;
				}
			} else {
				if(this.scroll) {
					setTimeout(function () {
						self.scroll.refresh();
						if(elementIndex) self.scroll.scrollToElement('.articleItem:nth-child('+elementIndex+')', 500);
					}, 500);
				} else {
					setTimeout(function () {
						self.createScroll();
					}, 500);
				}
			};
		},
		createScroll: function(){
			var self = this;

			var el = this.$('input[type=text], input[type=password], input[type=search], textarea, select');
			el.each(function(i){
				el[i].addEventListener(on.env.touchClick, function(e) { e.stopPropagation() }, false);
				el[i].addEventListener('touchstart', function(e) { e.stopPropagation() }, false);			
			});

			this.scroll = new iScroll(self.baseID, {
				useTransition	: true,
				useTransition	: true,
				hScroll 		: false,
				zoom			: false,
				scrollbarClass	: 'detailScrollbar',
				topOffset		: this.pullDownOffset,
				onRefresh		: function(){
					if (self.pullDownEl.className.match('loadingSmall')) {
						self.pullDownEl.className = '';
						self.pullDownEl.querySelector('.label').innerHTML = 'Pull down to refresh...';
					} else if (self.pullUpEl.className.match('loadingSmall')) {
						self.pullUpEl.className = '';
						self.pullUpEl.querySelector('.label').innerHTML = 'Pull up to load more...';
					}
				},
				onScrollMove	: function(){
					if (this.y > 5 && !self.pullDownEl.className.match('flip')) {
						self.pullDownEl.className = 'flip';
						self.pullDownEl.querySelector('.label').innerHTML = 'Release to refresh...';
						this.minScrollY = 0;
					} else if (this.y < 5 && self.pullDownEl.className.match('flip')) {
						self.pullDownEl.className = '';
						self.pullDownEl.querySelector('.label').innerHTML = 'Pull down to refresh...';
						this.minScrollY = -self.pullDownOffset;
					} else if (this.y < (this.maxScrollY - 5) && !self.pullUpEl.className.match('flip')) {
						self.pullUpEl.className = 'flip';
						self.pullUpEl.querySelector('.label').innerHTML = 'Release to refresh...';
						this.maxScrollY = this.maxScrollY;
					} else if (this.y > (this.maxScrollY + 5) && self.pullUpEl.className.match('flip')) {
						self.pullUpEl.className = '';
						self.pullUpEl.querySelector('.label').innerHTML = 'Pull up to load more...';
						this.maxScrollY = self.pullUpOffset;
					}
				},
				onScrollEnd		: function(){ 
					if (self.pullDownEl.className.match('flip')) {
						self.pullDownEl.className = 'loadingSmall';
						self.pullDownEl.querySelector('.label').inner = 'Loading...';	
						self.pullDownAction(self);
					} else if (self.pullUpEl.className.match('flip')) {
						self.pullUpEl.className = 'loadingSmall';
						self.pullUpEl.querySelector('.label').innerHTML = 'Loading...';				
						self.pullUpAction(self);
					}
				}
			})
		},
		toggleDisplay: function(){
			var self = this;
			if(this.model.get('selected')) {
				var collection = this.viewA.collection || false;
				this.app.set({selectedArticleList: collection});
				this.$el.fadeIn(200,function(){
					var eh = self.$('.eventList').height(),
						$a = self.$('.articleList');					
					if(eh > $a.height()) $a.height( eh );
					
					self.updateScroll();
				});
			}else{
				this.$el.fadeOut(200,function(){
					if(self.scroll) {
						self.scroll.destroy();
						self.scroll = null;
					}
				});
			}
		},
		createChannel: function(e){
			e.preventDefault();
			this.app.set({selectedItemUID: 'channel|create|' + escape(this.model.get('title'))})
			//this.app.route.navigate('/channel/create/' + escape(this.model.get('title')), {trigger: true});
		}
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Detail View Lists ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// List views for related items in detail view
	var ChannelListDetailView = _ListView.extend({
		tagName: 'section',
		className: 'content channelList clearfix',
		title: false, // set when creating view
		itemView: function(item){ 
			return ( this.type === 'list' )? new ChannelDetailHomeView({model:item, app:this.options.app}) : new ChannelDetailView({model:item, app:this.options.app}); 
		},
		helpViewTemplate: function(){
			var name;
			switch(this.type){
				case 'search':
					name = 'detailSearchChannel';
					break;
				case 'channel':
				case 'event':
					//name = 'detailDefaultChannel';
					break;
				case 'list':
					name = 'detailHomeChannel';
				default:
					break;
			};
			return name;
		}
	});
	var EventListDetailView = _ListView.extend({
		tagName: 'section',
		className: 'content eventList',
		title: false,
		itemView: function(item){ return new EventDetailView({model:item, app:this.options.app}) },
		helpViewTemplate: function(){
			var name = false;
			switch(this.type){
				case 'search':
					name = 'detailSearchEvent';
					break;
				case 'channel':
				case 'event':
					name = 'detailDefaultEvent';
					break;
				case 'list':
				default:
					break;
			};
			return name;
		}
	});

	var ArticleListView = _ListView.extend({
		tagName: 'section',
		className: 'content articleList',
		onInit: function(){
			this.adverts = this.options.adverts;
		},
		itemView: function(article){ 
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
			return view;
		},
		helpViewTemplate: function(){
			var name = false;
			switch(this.type){
				case 'search':
					name = 'detailSearchArticle';
					break;
				case 'channel':
				case 'event':
					name = 'detailDefaultArticle';
					break;
				case 'list':
				default:
					break;
			};
			return name;
		},
		updateView: function(){
			// runs after all articles are added
			if(!this.adverts || !this.adverts.advert) return;
			
			var articles = this.$('article.articleItem'),
				count = -1;

			$.each(this.adverts.advert,  function(i,v){
				var ad = '<article class="articleItem advert" style="background-color:'+v.bgColour+'"><a href="'+v.link+'"><img src="'+v.image+'" alt="'+v.text+'" /></a></article>';
				count += 3;
				$( articles[count] ).after( $(ad) );
			});
			
		}
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Detail List Items ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Item view for related items in detail view
	var ChannelDetailView 	= ChannelView.extend({
		className:'channelItem',
		template: _.template( $('#channelDetailItemTemplate').html() ),
		render: function(){
			this.$el.html(this.template( this.model.toJSON() ));
			var hex = this.model.get('branding');
			if(hex){
				hex = hex.split(',');
				this.$('a').css({'background-color':hex[0]});
				if(hex.length == 2) this.$('h1').css({'color':hex[1]});
			}
		    return this;
		}
	});
	var ChannelDetailHomeView = ChannelView.extend({
		className:'channelListItem',
		template: _.template( $('#channelDetailHomeItemTemplate').html() ),
		render: function(){
			this.$el.html(this.template(this.model.toJSON()));
			var hex = this.model.get('branding');
			if(hex){
				hex = hex.split(',');
				this.$el.css({'background-color':hex[0]});
				if(hex.length == 2) this.$('header h1').css({'color':hex[1]});
			}
		    return this;
		}
	});
	var EventDetailView = EventView.extend({
		className:'eventItem bb',
		template: _.template( $('#eventDetailItemTemplate').html() ),
		render: function(){
			var json = this.model.toJSON();
			json.participantsObj = $().convertToObject(json.participants);
			this.$el.html(this.template( json ));
		    return this;
		},
	});
	

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Article item views ///////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var ArticleView_twitter = _ArticleView.extend({
		className: 'twitter articleItem',
		template: _.template( $('#articleTemplate-twitter').html() ),
		render: function(){
			var json = this.model.toJSON();
			console.log(json)
			if(!json.filtered) this.$el.addClass('hidden');
			this.$el.html(this.template(json));
		    return this;
		}
	});
	var ArticleView_youtube = _ArticleView.extend({
		className: 'youtube articleItem',
		template: _.template( $('#articleTemplate-youtube').html() ),
		render: function(){
			var json = this.model.toJSON();
			json.vid = json.videos.replace('http://gdata.youtube.com/feeds/base/videos/','');
			this.model.set({vid:json.vid});
			console.log(json)
			if(!json.filtered) this.$el.addClass('hidden');
			this.$el.html(this.template(json));
		    return this;
		}
	});
	var ArticleView_rss = _ArticleView.extend({
		className: 'rss articleItem',
		template: _.template( $('#articleTemplate').html() ),
		preSelect: function(e){
			var json = this.model.toJSON();
			console.log(json)
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
			'click .close'			: 'close',
			'click button.cancel'	: 'close'
		},
		initialize: function(){
			_.bindAll(this, 'updateView', 'getModel', 'close', 'show', 'hide');
			this.app = this.options.app;
			this.app.on('change:selectedArticle', this.updateView);
			
			ev.on('open:overlay', this.updateView);
			ev.on('close:overlay', this.hide);
			// ev.trigger('open:overlay', false, 'feedback');
			// ev.trigger('close:overlay');
		},
		updateView: function(app, id){
			var oldId = this.app.previous('selectedArticle');
			
			console.log(oldId, id);

			if(id === oldId || ( !id && !oldId )){
				// no change do nothing
				return;
			} else if(oldId && this.view){
				// hide old article
				this.hide();
			};
			
			if(id){
				if( (/feedback/gi).test(id) ){
					var data = { hash: document.location.hash, url: document.location, user: this.app.get('user'), useragent: window.navigator.userAgent };
					this.view = new ADIV_feedback();
					this.$el.append( this.view.render(data).el );
					this.show();
				}else{
					// show article
					this.getModel(id);
				}
			}

		},
		getModel: function(id){
			var self = this,
				list = this.app.get('selectedArticleList'),
				model;
			
			function loadModel(){
				model = new BB.Article({ id:id });
				model.fetch({
					success:function(){
						self.view = self.selectView(model);
						self.$el.append( self.view.render().el );
						self.show();
					}, 
					error:function(){
						console.error('Article.addContent - fetch error')
						self.close()
					}
				});
			}
			if(list){
				model = list.id;
				if(model){
					this.view = this.selectView(model);
					this.$el.append(this.view.render().el);
					this.show();
				}else{
					loadModel();
				}
			}else{
				loadModel();
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
					return (model.get('iframe') || !model.get('extended'))? new ADIV_iframe({model:model}) : new ADIV({model:model});
			};
		},
		close: function(){
			this.app.setTitle();
			if(!this.app.get('selectedArticle')){
				this.hide();
			}else{
				this.app.set({ selectedArticle : false });
			}
			return false;
		},
		show: function(){
			var iframe = this.$('.iframeWrap');
			if(iframe.length){
				iframe.css({opacity:0});
				this.$el.addClass('on');
				setTimeout(function () {
					iframe.css({opacity:1});
					this.view.setScroll();
				}, 1500);
			}else{
				this.$el.addClass('on');
				this.view.setScroll();
			}
		},
		hide: function(){
			var self = this;
			this.$el.removeClass('on');
			setTimeout(function () {
				self.view.close();
				self.view = false;
			}, 1000);
			//if( this.app.get('selectedArticle') ) this.app.set({selectedArticle:false});
		}
	});

	// ADIV = ArticleDetailItemView
	var ADIV = Backbone.View.extend({
		tagName: 'article',
		baseId: 'articleContentWrap',
		className:'articleDetail',
		template: _.template( $('#static_feedbackTemplate').html() ),
		initialize: function(){
			_.bindAll(this, 'render', 'setScroll');
		},
		render: function(data){
			var json = (data)? data : this.model.toJSON();
			this.$el.html(this.template(json));
		    return this;
		},
		// close: function(){
			// this.app.set({ selectedArticle : false });
			// this.app.setTitle();
			// return false;
		// },
		setScroll: function(){
			var self = this,
				id = this.baseId,
				$contentWrapper = this.$('.contentWrapper'),
				pageLength = $contentWrapper.height(),
				contentLength = this.$('.scroller').height();

			$contentWrapper.attr('id', this.baseId);

			if(contentLength < pageLength) {
				return
			}else if(contentLength > pageLength){
				var el = this.$('input[type=text], input[type=password], input[type=search], textarea, select');
				el.on('ontouchstart mousedown touchstart', function(e) { e.stopPropagation() })

				setTimeout(function () {
					self.scroll = new iScroll(id, {hScroll:false, zoom: false, scrollbarClass: 'detailScrollbar'});
				}, 500);
			};
		}
	});
	
	var ADIV_feedback = ADIV.extend({
		className:'articleFeedback',
		template: _.template( $('#static_feedbackTemplate').html() ),
		events: {
			'submit form': 'submit'
		},
		submit: function(e){
			e.preventDefault();
			var self = this,
				$close = this.$('.close'),
				$form = this.$('form'),
				data = $form.serializeObject();
			
			$form.addClass('loadingMask');
			
			$.post('/feedback', data, function(res){
				$form.removeClass('loadingMask');
				self.$el.addClass('complete');
				setTimeout(function () {
					$close.click();
					self.$el.removeClass('complete');
				}, 2500);
			})
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
		},
		focus: function(){
			ev.trigger('update:view', 'showcomments');
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
		},
		focus: function(){
			ev.trigger('update:view', 'showcomments');
		}
	});
	
	var CommentListView = Backbone.View.extend({
		el : $('#listChat'),
		scroll: null,
		
		events: {
			'click #chatContentWrap' : 'checkView',
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
			_.bindAll(this, 'checkView', 'changeTab', 'updateScroll');
			
				// comment lists views
			var onsideComments = new OnsideCommentListView({app: this.options.app, collection:this.app.comments}),
				twitterComments = new TwitterCommentListView({app: this.options.app, collection:this.app.tweets}),
				facebookComments = new FacebookCommentListView({app: this.options.app}),			
				// Post Comment view
				onsideCommentsPost = new CommentPostView({ app: this.options.app, collection:this.app.comments });
			
			this.changeTab(false, this.$('nav a.onside') );
			
			ev.on('update:scroll:comments', this.updateScroll, this);
			ev.trigger('update:scroll:comments');
		},
		checkView: function(){
			ev.trigger('update:view', 'showcomments');
		},
		updateScroll: function(){
			var self = this;
			setTimeout(function () {
				var el = this.$('input[type=text], input[type=password], input[type=search], textarea, select'),
					needsScroll = (self.$('#chatContentWrap').height() >= self.$('#chatContentWrap > .scroller').height())? false : true,
					scroll = (self.scroll === null)? false : true;

				if(needsScroll && scroll){
					self.scroll.refresh();
				} else if(needsScroll && !scroll){
					el.on('ontouchstart mousedown touchstart', function(e) { e.stopPropagation() });
					self.scroll = new iScroll('groupContentWrap', {hScroll:false, zoom: false, scrollbarClass: 'commentScrollbar'});
				} else if (!needsScroll && scroll){
					el.off('ontouchstart mousedown touchstart');
					self.scroll.destroy();
					self.scroll = null;
				}
			}, 100);
		},
		changeTab: function(e, el){
			if(e){
				e.preventDefault();
				var newTab = $(e.target);
			}else if(el){
				newTab = el;
			}
			
			var newBlock = newTab.attr('href');
			
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
			
			var self = this;
			this.app.on('change:selectedItemUID', this.checkContent); 
			this.app.on('change:selectedArticle', function(){
				var val = self.app.get('selectedItemUID');
				self.checkContent(false, val);
			});

			if(this.collection) {
				this.collection.on('add', this.addOne);
				this.collection.on('reset', this.addAll);
			};
			this.onInit();
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
			if(this.$help) this.$help.remove();
		},
		checkContent: function(model, val){
			this.reset();
			var s = val.split('|');
			if( (/list|search|static/gi).test(s[0]) || (/null|create/gi).test(s[1]) ){
				// no comments on certain pages - may be simpler to test revers (check for channel/event/article)
				this.showHelp('general');
			}else if(!this.auth){
				// not auth to use this module - login help
				this.showHelp('auth');
			}else{
				this.setupComments(val);
			};
		},
		showHelp: function(type){
			var help = (type === 'general')? this.helpGeneral : this.helpAuth,
				view = new _HelpView();
				
			this.$help = $( view.render(help).el );
			this.$el.prepend(view.render(help).el);
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
		},
		setupComments: function(val){
			var s = val.split('|');
//			this.collection.reset();
			this.collection.urlParams = '?' + s[0] +'='+ s[1];
			this.collection.fetch();
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
			console.log(this.model.toJSON())
			this.$el.html(this.template(this.model.toJSON()));
		    return this;
		}
	});
	var TweetView = CommentView.extend({
		className: 'tweet bb',
		template:  _.template( $('#tweetTemplate').html() ),
		render: function(){
			var json = this.model.toJSON();
			if(typeof json.user === 'object'){
				this.$el.html(this.officialTemplate(this.model.toJSON()));			
			}else{
				this.$el.html(this.template(this.model.toJSON()));
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

