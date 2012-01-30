var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){

	var sortObject = function(obj){
		var key, a = [];
		for(key in obj){
			if(key !== 'id') a.push(key);
		}
		return a;
	}

	var _pageView = Backbone.View.extend({
		events: {
			'click .create'			: 'createModel',
			'click .filterToggle'	: 'toggleFilters',
			'submit .filter form'	: 'submitFilters'
		},
		title: 'Unknown',
		initialize: function(){
			_.bindAll(this, 'createModel', 'toggleFilters', 'submitFilters', 'addOne', 'addAll', 'setupTable' );
			this.cms = this.options.cms;
			this.overlay = this.options.overlay;

			this.headBuilt = false;
			this.$table = this.$('table');
			this.$thead = this.$('table > thead');
			this.$tbody = this.$('table > tbody');
			
			this.collection = this.options.collection;
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			this.collection.bind('error', function(xhr){
				console.error('error on collection')
				console.log(xhr);
			});
		},
		createModel: function(){
			var self = this,
				model = new this.collection.model, //on.m.cms.channels.model,
				view = new _createView({collection:this.collection, model:model, cms:this.options.cms, overlay: this.options.overlay}),
				html = view.render().el;
			
			$('h3',html).text('Create ' + this.title );
			this.overlay.updateContent(html, function(){
				self.overlay.show();
			});
		},
		toggleFilters: function(e){
			e.preventDefault();
			this.$('.filter form').toggle();
		},
		submitFilters: function(e){
			e.preventDefault();
			this.collection.params = this.$('.filter form').serialize();
			this.collection.fetch();
		},
		addOne: function(model, index){
			if(!this.headBuilt && index === 0) this.setupTable(model);
			var view = new _rowView({model:model, cms:this.options.cms, overlay: this.options.overlay, title: this.title})
			this.$tbody.append(view.render().el);
		},
		addAll: function(){
			this.$tbody.empty();
			if(this.collection.length === 0){
				this.$tbody.append( $('<tr><td><p>There are currently no items to see. Please add one.</p></td></tr>') );
			}else{
				this.collection.each(this.addOne);
				this.$table.tablesorter({ sortList: [[1,0]] });
			}
		},
		setupTable: function(model){
			var json = model.toJSON(),
				html = $('<tr></tr>'),
				arr = sortObject(json);
				
			_.each(arr,function(key,i){
				var th = $('<th class="header key_'+key+'"><span>'+key+'</span></th>')
				html.append(th);
			});

			this.$thead.prepend(html);
			this.headBuilt = true;
		}
	});
	
	var _rowView = Backbone.View.extend({
		tagName : 'tr',
		events: {
			'click .edit' 	: 'showItem',
			'click .expand'	: 'showContent'
		},
		initialize: function(){
			_.bindAll(this, 'render', 'buildRow', 'updateRow', 'showItem', 'showContent');
			this.cms = this.options.cms;
			this.overlay = this.options.overlay;
			this.title = this.options.title;
			this.model.bind('change', this.updateRow);
		},
		render: function(){
			var json = this.model.toJSON(),
				html = this.buildRow(json);
			
			$(this.el).html(html);
		    return this;
		},
		buildRow: function(json){
			var html = '',
				arr = sortObject(json),
				defaults = this.model.defaultOptions;
				
			_.each(arr,function(key,i){
				var opts = defaults[key],
					v = json[key];
		
				if(v === 'null' || v ===  null) v = '';
				var existsString = (v && v.length >= 1 && v !== '0' )? 'hasValue' : 'noValue';				
				
				if(opts && opts.expand){
					html += '<td class="key_'+key+'"><span class="expand" data-key="'+key+'">expand '+key+'</span></td>';
				}else{
					html += '<td class="key_'+key+'"><span class="'+existsString+'">'+v+'</span></td>';
				}
			});
			html += '<td class="edit"><span>edit</span></td>'
			return html;
		},
		updateRow: function(){
			var html = this.buildRow( this.model.toJSON() );
			$(this.el).html(html);
		},
		showItem: function(){
			var self = this,
				view = new _editView({model:this.model, cms:this.options.cms, overlay: this.options.overlay}),
				html = view.render().el;
			
			$('h3',html).text('Edit ' + this.title );
			this.overlay.updateContent(html, function(){
				self.overlay.show();
			});
		},
		showContent: function(e){
			var self = this,
				title = 'View ' + this.title + ': ' + key,
				$el = $(e.target),
				key = $el.attr('data-key'),
				content = $('<pre class="prettyprint">' + this.model.get(key) + '</pre>'),
				view = new _editView({model:false, cms:this.options.cms, overlay: this.options.overlay}),
				html = view.render(title,content).el;

			this.overlay.updateContent(html, function(){
				self.overlay.show();
			});
		}
	});
	var _editView = Backbone.View.extend({
		tagName : 'div',
		template: _.template( $('#overlayTemplate').html() ),
		events: {
			'click .cancel' : 'closeItem',
			'click .delete' : 'deleteItem',
			'click .save' 	: 'updateItem'
		},
		initialize: function(){
			_.bindAll(this, 'error', 'success', 'render', 'closeItem', 'deleteItem', 'updateItem');
			this.overlay = this.options.overlay;
			
		},
		render: function(title, content){
			var json = (this.model)? this.model.toJSON() : false;
			$(this.el).html(this.template(json));
			
			if(title) this.$('h3').text(title);
			if(json) this.$('.modal-body').append( this.buildForm(json) );
			if(content) this.$('.modal-body').append( $(content) );
		    return this;
		},
		buildForm: function(json){
			var inner = '';
			for(var key in this.model.defaultOptions){
				var opts = this.model.defaultOptions[key] || {type:false},
					disabledString = (opts.editable === undefined || opts.editable !== false)? '' : 'disabled="true"',
					setValue = json[key] || '';
				
				inner += '<div class="clearfix"><label for="'+key+'">'+key+'</label><div class="input">';
				switch(opts.type){
					case 'text':
						inner 	+= '<input '+disabledString+' type="text" size="30" name="'+key+'" id="'+key+'" class="xlarge" value="'+setValue+'">';
						break;
					case 'email':
						inner 	+= '<input '+disabledString+' type="email" size="30" name="'+key+'" id="'+key+'" class="xlarge" value="'+setValue+'">';
						break;
					case 'select':
						inner += '<select id="'+key+'" name="'+key+'">';
						$.each(opts.values, function(i,val){
							var selectedString = (val.toString() === setValue)? 'selected="true"' : '';
							inner += '<option '+selectedString+' value="'+val+'">'+val+'</option>';
						});
                		inner += '</select>'; 
						break;
				};
				if(opts.help) inner += '<span class="help-block">'+ opts.help +'</span>';
				inner += '</div></div>';
			}
			this.$form = $('<form><fieldset>'+inner+'</fieldset></form>');
			return this.$form;
		},
		closeItem: function(){
			this.overlay.hide();
		},
		deleteItem: function(){ alert('delete not available') },
		updateItem: function(e){
			this.$('a.save').button('loading');
			if(this.$form){
				var self = this,
					data = this.$form.serializeArray(),
					obj = {},
					hash = {
						success: self.success,
						error: self.error
					};

				$.each(data, function(i,val){
					obj[val.name] = val.value;
				});
				this.model.save(obj, hash);
			}
		},
		error: function(model,XHR,options){
			this.$('a.save').button('reset');
			this.$('.modal-footer > .alert-message').remove();
			this.$('.modal-footer').prepend( $('<div class="alert-message error"><a href="#" class="close">×</a><p><strong>Bugger!</strong> '+XHR.responseText+'.</p></div>') );
		},
		success: function(){
			this.$('a.save').button('reset');
			this.overlay.hide();
		}
	});
	var _createView = _editView.extend({
		updateItem: function(){
			if(this.$form){
				var self = this,
					data = this.$form.serializeArray(),
					obj = {},
					hash = {
						success: self.success,
						error: self.error
					};

				$.each(data, function(i,val){
					obj[val.name] = val.value;
				});

				this.collection.create(obj, hash);
			};
		}
	});

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

	var cmsView = Backbone.View.extend({
		el : $('#OnsideCMS'),
		events: {
			'click #primaryNav a' : 'updateNav',
			'focus .dynamicSelect' : 'buildSelect'
		},
		initialize: function(){
			console.info('# View.cms.init');
			_.bindAll(this, 'updateNav', 'buildSelect');
			//this.app = this.options.app;
			this.cms = this.options.cms;
			
			var overlay 	= new overlayView();
			this.users 		= new userPageView(		{cms: this.options.cms, collection: this.options.cms.users, overlay:overlay});
			this.channels 	= new channelPageView(	{cms: this.options.cms, collection: this.options.cms.channels, overlay:overlay});
			this.events 	= new eventPageView(	{cms: this.options.cms, collection: this.options.cms.events, overlay:overlay});
			this.sources 	= new sourcePageView(	{cms: this.options.cms, collection: this.options.cms.sources, overlay:overlay});
			this.articles 	= new articlePageView(	{cms: this.options.cms, collection: this.options.cms.articles, overlay:overlay});
			this.$('#primaryNav a:first').click();
			
			this.users.collection.fetch();
			this.channels.collection.fetch();
			this.events.collection.fetch();
			this.sources.collection.fetch();
			this.articles.collection.fetch();

		},
		updateNav: function(e){
			e.preventDefault();
			
			if(this.activeLink) this.activeLink.removeClass('active');
			if(this.activeTab) this.activeTab.removeClass('active');
			
			var $el = $(e.target),
				$li = $el.parent('li'),
				$id = $( $el.attr('href') );
			
			$li.addClass('active');
			$id.addClass('active');
			
			this.activeLink = $li;
			this.activeTab = $id;
		},
		buildSelect: function(e){
			var $el = $(e.target),
				d = $el.attr('data-content'),
				html ='';
				
			if(this.cms[d] && this.cms[d].models.length) {
				html += '<option value="">all</option>';
				$.each(this.cms[d].models, function(){
					html += '<option value="'+this.id+'">'+this.get('name')+'</option>';
				});
				$el.html(html);
			};
		}
		
	});
	
	var overlayView = Backbone.View.extend({
		el : $('#overlay'),
		visable: false,
		initialize: function(){
			_.bindAll(this, 'updateContent', 'show', 'hide');
			var self = this;
			
			this.el.modal({
				backdrop: true, 
				keyboard: true,
			});
			
			this.el.bind('hide', function(){
				self.visable = false;
			}).bind('shown',function(){
				self.visable = true;
				var maxHeight = $(window).height() - 270,
					$body = self.$('.modal-body'),
					bh = $body.height();
				if( bh >= maxHeight ) $body.height(maxHeight);
			});
		},
		updateContent: function(html, f){
			this.el.empty();
			this.el.append(html);
			if(typeof f === 'function') f();
		},
		show: function(){
			this.el.modal('show');
		},
		hide: function(){
			this.el.modal('hide');
		}
	});
	
	var userPageView = _pageView.extend({
		el : $('#users'),
		title: 'User'
	});
	
	var channelPageView = _pageView.extend({
		el : $('#channels'),
		title: 'Channel'
	});

	var eventPageView = _pageView.extend({
		el : $('#events'),
		title: 'Event'
	});

	var sourcePageView = _pageView.extend({
		el : $('#sources'),
		title: 'Source'
	});

	var articlePageView = _pageView.extend({
		el : $('#articles'),
		title: 'Article'
	});


	BB.cmsView = cmsView;
	BB.userPageView = userPageView;
	BB.channelPageView = channelPageView;
	BB.sourcePageView = sourcePageView;

})(this.BB);
