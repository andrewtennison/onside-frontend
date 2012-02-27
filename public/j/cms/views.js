var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){

	var sortObject = function(obj){
		var key, a = [];
		for(key in obj){
			if(key !== 'id') a.push(key);
		}
		a = _.union(['id'], a); 
		return a;
	}

	var _pageView = Backbone.View.extend({
		events: {
			'click .create'			: 'createModel',
			'submit .filter form'	: 'submitFilters',
			'submit .refine form'	: 'submitRefine',
			'reset .refine form'	: 'resetRefine'
		},
		title: 'Unknown',
		initialize: function(){
			_.bindAll(this, 'toggleView', 'createModel', 'submitFilters', 'submitRefine', 'addOne', 'addAll', 'setupTable' );
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
				console.error('error on collection');
				console.log(xhr);
			});

			this.cms.bind('change:selectedPage', this.toggleView);
			//this.cms.on('change:selectedItem', this.toggleView);
		},
		toggleView: function(model,val){
			var $item = $('#' + val),
				prev = this.cms.previous("selectedPage"),
				$prevItem = $('#' + prev);
			
			if( $item.length ){
				$item.addClass('active');
				if(prev) $prevItem.removeClass('active');
			};
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
		submitFilters: function(e){
			e.preventDefault();
			this.collection.params = this.$('.filter form').serialize();
			this.collection.fetch();
		},
		resetRefine: function(e){
			this.submitRefine(e,true);
		},
		submitRefine: function(e, clear){
			e.preventDefault();
			var key = this.$('#tableSelect').val(),
				val = this.$('#tableValues').val(),
				search = this.$('#tableSearch').val();

			this.collection.each(function(model){
				if(clear || model.get(key) === val || model.get(key).match(search) ){
					model.set({show:true})
				}else{
					model.set({show:false})
				}
			})
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
				html = '<tr><th></th>',
				arr = sortObject(json);
				
			_.each(arr,function(key,i){
				html += '<th class="header key_'+key+'"><span>'+key+'</span></th>';
			});
			
			html += '</tr>'

			this.$thead.prepend( $(html) );
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
				
			html += '<td class="edit"><span>edit</span></td>'
			_.each(arr,function(key,i){
				var opts = defaults[key],
					v = json[key];
						
				if(v === 'null' || v ===  null) v = '';
				var existsString = (v && v.length >= 1 && v !== '0' )? 'hasValue' : 'noValue';				
				
				if(key === 'show'){
					//
				} else if(key === 'avatar' && (/.jpg|.gif|.png/gi).test(v)){
					html += '<td class="key_'+key+'"><img src="'+v+'" /></td>';					
				} else if(opts && opts.expand){
					html += '<td class="key_'+key+'"><span class="expand" data-key="'+key+'">expand '+key+'</span></td>';
				}else{
					html += '<td class="key_'+key+'"><span class="'+existsString+'">'+v+'</span></td>';
				}
			});
			return html;
		},
		updateRow: function(){
			var html = this.buildRow( this.model.toJSON() ),
				show = this.model.get('show');
				
			if(show){
				$(this.el).css({display:'table-row'});				
			}else{
				$(this.el).css({display:'none'});
			}
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
			'click .save' 	: 'updateItem',
			'click .lookup'	: 'lookup',
			'click .hiddenLookup a' : 'addLookupItem',
			'change .populateDefaults' : 'populateForm'
		},
		initialize: function(){
			_.bindAll(this, 'error', 'success', 'render', 'closeItem', 'deleteItem', 'updateItem', 'lookup', 'addLookupItem');
			this.overlay = this.options.overlay;
			this.cms = this.options.cms;
		},
		render: function(title, content){
			var json = (this.model)? this.model.toJSON() : false;
			$(this.el).html(this.template(json));
			
			if(title) this.$('h3').text(title);
			if(json) this.$('.modal-body').append( this.buildForm(json) );
			if(content) this.$('.modal-body').append( $(content) );
			
			this.populateForm();
		    return this;
		},
		buildForm: function(json){
			console.info('build form')
			var inner = '';
			for(var key in this.model.defaultOptions){
				var opts = this.model.defaultOptions[key] || {type:false},
					disabledString = (opts.editable === undefined || opts.editable !== false)? '' : 'disabled="true"',
					setValue = json[key] || '';
				
				inner += '<div class="control-group"><label class="control-label" for="'+key+'">'+key+'</label><div class="controls">';
				switch(opts.type){
					case 'text':
						inner 	+= '<input '+disabledString+' type="text" size="30" name="'+key+'" id="'+key+'" class="xlarge" value="'+setValue+'">';
						break;
					case 'textarea':
						inner 	+= '<textarea '+disabledString+' name="'+key+'" id="'+key+'" class="xlarge">'+setValue+'</textarea>';
						break;
					case 'email':
						inner 	+= '<input '+disabledString+' type="email" size="30" name="'+key+'" id="'+key+'" class="xlarge" value="'+setValue+'">';
						break;
					case 'select':
						var popString = (this.model.defaultOptions[key].populateDefaults)? ' populateDefaults' : '';
						inner += '<select id="'+key+'" name="'+key+'" class="'+popString+'">';
						$.each(opts.values, function(i,val){
							var selectedString = (val.toString() === setValue)? 'selected="true"' : '';
							inner += '<option '+selectedString+' value="'+val+'">'+val+'</option>';
						});
                		inner += '</select>'; 
						break;
				};
				if(opts.lookup){
					inner += '<a class="lookup btn btn-primary" href="#">+</a><ul class="hiddenLookup">';
					console.info(opts.lookup)
					console.info(this.cms[opts.lookup])
					this.cms[opts.lookup].each(function(model, i){
						inner += '<li><a href="#" data-json="{id:'+model.id+', name:'+model.get('name')+'}">'+model.get('name')+'</a></li>';
					});	
					inner += '</ul>';
				}
				
				if(opts.help) inner += '<p class="help-block">'+ opts.help +'</p>';
				inner += '</div></div>';
			}
			this.$form = $('<form class="form-horizontal"><fieldset>'+inner+'</fieldset></form>');
			return this.$form;
		},
		closeItem: function(e){
			if(e) e.preventDefault();
			this.overlay.hide();
		},
		deleteItem: function(){ alert('delete not available') },
		updateItem: function(e){
			e.preventDefault();
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
					if(val.value.length == 0 || !val.value) val.value = null;
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
		},
		lookup: function(e){
			e.preventDefault();
			var el = $(e.target);
			el.siblings('.hiddenLookup').toggle();
		},
		addLookupItem: function(e){
			e.preventDefault();

			var el = $(e.target),
				input = el.parent().parent().parent().find('input'),
				v = input.val(),
				json = el.attr('data-json');

			input.val(v + ',' + json);
		},
		populateForm: function(){
			var type = this.$('.populateDefaults').val() || 'defaultVal';
			for(var key in this.model.defaultOptions){
				var defaultVal = this.model.defaultOptions[key][type];
				if(defaultVal){
					var $el = this.$('#'+key);
					if(!$el.val()) $el.val(defaultVal);
				}
			};
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
					if(val.value.length == 0 || !val.value) val.value = null;
					obj[val.name] = val.value;
				});
				this.collection.create(obj, hash);
				return false;
			};
		}
	});
	var _contentItemView = Backbone.View.extend({
		template: _.template( $('#detailTemplate').html() ),
		initialize: function(){
			_.bindAll(this, 'render');
			this.title = this.options.title || 'undefined';
		},
		render: function(){
			var json = {}; 
			json.item = (this.model)? this.model.toJSON() : false;
			json.title = this.title;

			$(this.el).html(this.template(json));
		    return this;
		}
	});

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

	var cmsView = Backbone.View.extend({
		el : $('#OnsideCMS'),
		events: {
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
			this.relations	= new relationsPageView({cms: this.options.cms, overlay:overlay});
			this.emails 	= new emailPageView(	{cms: this.options.cms, collection: this.options.cms.emails, overlay:overlay});
			this.$('#primaryNav a:first').click();
			
			this.users.collection.fetch();
			this.channels.collection.fetch();
			this.events.collection.fetch();
			this.sources.collection.fetch();
			this.articles.collection.fetch();
			this.emails.collection.fetch();

			this.cms.bind('change:selectedPage', this.updateNav);
			//this.cms.on('change:selectedItem', this.updateNav);
		},
		updateNav: function(model,val){
			var $navItem = $('#nav_' + val),
				prev = this.cms.previous("selectedPage"),
				$prevNavItem = $('#nav_' + prev)
			
			if( $navItem.length ){
				$navItem.addClass('active');
				if(prev) $prevNavItem.removeClass('active');
			};
		},
		buildSelect: function(e){
			var self = this,
				$el = $(e.target),
				d = $el.attr('data-content'),
				html ='';
				
			if(d === 'table'){
				var id = this.activeID,
					collection = this.cms[id],
					json = collection.models[0].toJSON();
					
				for(var key in json){ html += '<option value="'+key+'">'+key+'</option>' }
				$el.html(html);
				$el.change(function(){
					var html = '<option></option>',
						v = this.value,
						list = collection.pluck(v);
					
					list = _.uniq(list);
					$.each(list,function(i){
						html += '<option value="'+list[i]+'">'+list[i]+'</option>';
					})
					self.$('#tableValues').html(html);
				})
				
			} else if (this.cms[d] && this.cms[d].models.length) {
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
	
	var relationsPageView = Backbone.View.extend({
		el: $('#relations'),
		form: false,
		type: false,
		events: {
			'click a.btn' : 'setupOverlay',
			'submit form#relate' : 'submitForm'
		},
		initialize: function(){
			_.bindAll(this, 'setupOverlay', 'submitForm', 'buildFormItem');
			this.cms = this.options.cms;
			this.overlay = this.options.overlay;
		},
		setupOverlay: function(e){
			e.preventDefault();
			
			if(this.form) this.form.remove();
			
			var self = this,
				el = $(e.target),
				rel = el.attr('data-rel'),
				s = rel.split(':'),
				string = '<form id="relate" class="form-horizontal"><div class="row"><div class="control-group"><label>Relationship</label><div class="controls"><select name="relate"><option value="relate">Relate</option><option value="unrelate">Unrelate</option></select></div></div>';
			
			$.each(s, function(i,val){
				string += self.buildFormItem(val);				
			});
			string += '</div><div class="form-actions"><button type="submit" class="btn btn-primary" data-loading-text="saving...">save</button></div></form>';
			
			this.type = rel;			
			this.form = $(string);
			this.el.append(this.form);
			
			$('#relate').button()
			
		},
		buildFormItem: function(val){
			console.log(val)
			var string = '';
			if(val === 'channel'){
				string += '<div class="control-group"><label for="channel">Select a channel</label><div class="controls"><select name="channel">';
				this.cms.channels.each(function(model){
					string += '<option value="'+ model.id +'">'+ model.get('name') +'</option>';
				})
			} else if(val === 'event'){
				string += '<div class="control-group"><label for="event">Select an event</label><div class="controls"><select name="event">';
				this.cms.events.each(function(model){
					string += '<option value="'+ model.id +'">'+ model.get('name') +'</option>';
				});
			}
			string += '</select></div></div>';
			return string;
		},
		
		submitForm: function(e){
			e.preventDefault();
			var params = $(e.target).serialize(),
				dir = (params.indexOf('relate=relate' !== -1))? true : false,
				url = '/api';
				
			$().button('loading');
			console.log(params);
			
			switch(this.type){
				case 'channel:channel':
					url += (dir)? '/channel/channel' : '/channel/nochannel';
					break;
				case 'channel:event':
				case 'event:channel':
					url += (dir)? '/event/channel' : '/event/nochannel';
					break;
				default:
				case 'event:event':
					alert('no url setup for: ' + this.type);
					break;
			};
			
			$.post(url, params, function(res){
				console.log(res);
				$().button('loading');
			});
		}
	});

	var emailPageView = _pageView.extend({
		el : $('#emails'),
		title: 'Email'
	});

	// var channelContentView = _contentView.extend({
		// el : $('#channelDetail'),
		// events: {},
		// initialize: function(){
// 			
			// // select channel from list
			// // populate / build page
		// }
	// });
	// var eventContentView = _contentView.extend({
		// el : $('#eventDetail'),
		// events: {},
		// initialize: function(){
// 			
			// // select channel from list
			// // populate / build page
		// }
	// });


	BB.cmsView = cmsView;
	BB.userPageView = userPageView;
	BB.channelPageView = channelPageView;
	BB.sourcePageView = sourcePageView;

})(this.BB);
