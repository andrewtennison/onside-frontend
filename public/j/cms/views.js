var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){

	var _pageView = Backbone.View.extend({
		events: {},
		initialize: function(){
			_.bindAll(this, 'addOne', 'addAll', 'setupTable' );
			this.cms = this.options.cms;
			this.overlay = this.options.overlay;

			this.headBuilt = false;
			this.$table = this.$('table');
			this.$thead = this.$('table > thead');
			this.$tbody = this.$('table > tbody');
			
			this.collection = this.options.collection;
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
		},
		addOne: function(model, index){
			if(!this.headBuilt && index === 0) this.setupTable(model);
			var view = new _rowView({model:model, cms:this.options.cms, overlay: this.options.overlay})
			this.$tbody.append(view.render().el);
		},
		addAll: function(){
			this.$tbody.empty();
			this.collection.each(this.addOne);
			this.$table.tablesorter({ sortList: [[1,0]] });
		},
		setupTable: function(model){
			var json = model.toJSON(),
				html = $('<tr></tr>');

			for(var key in json){
				var th = $('<th class="header">'+key+'</th>')
				html.append(th);
			};
			
			this.$thead.prepend(html);
			this.headBuilt = true;
		}
	});
	
	var _rowView = Backbone.View.extend({
		tagName : 'tr',
		events: {
			'click .edit' : 'showItem'
		},
		initialize: function(){
			_.bindAll(this, 'render', 'buildRow', 'showItem');
			this.cms = this.options.cms;
			this.overlay = this.options.overlay;
		},
		render: function(){
			var json = this.model.toJSON(),
				html = this.buildRow(json);
			
			$(this.el).html(html);
		    return this;
		},
		buildRow: function(json){
			var html = '';
			for(var key in json){
				html += '<td>'+json[key]+'</td>';
			};
			
			html += '<td class="edit">edit</td>'
			
			return html;
		},
		showItem: function(){
			var self = this,
				view = new _editView({model:this.model, cms:this.options.cms, overlay: this.options.overlay}),
				html = view.render().el;
				
				console.log(html)

			this.overlay.updateContent(html, function(){
				self.overlay.show();
			})
		}
	});
	var _editView = Backbone.View.extend({
		tagName : 'div',
		template: _.template( $('#overlayTemplate').html() ),
		events: {
			//'.edit click' : 'showItem'
		},
		initialize: function(){
			_.bindAll(this, 'render');
		},
		render: function(){
			var json = this.model.toJSON(),
				form = this.buildForm(json);

			$(this.el).html(this.template(json));
			this.$('.modal-body').append(form);
		    return this;
		},
		buildForm: function(json){
			var inner = '';
			
			for(var key in json){
				inner += '<div class="clearfix"><label for="'+key+'">'+key+'</label><div class="input"><input type="text" size="30" name="'+key+'" id="'+key+'" class="xlarge" value="'+json[key]+'"></div></div>';
			}
			
			var form = $('<form><fieldset>'+inner+'</fieldset></form>');
			console.log(form)
			
			return form
		}
	});




	var cmsView = Backbone.View.extend({
		el : $('#OnsideCMS'),
		events: {},
		initialize: function(){
			console.info('# View.cms.init');
			//_.bindAll(this, 'onResize', 'show', 'setAuth', 'triggerShow', 'triggerSearch');
			//this.app = this.options.app;
			
			var overlay = new overlayView();
			var user = new userPageView({cms: this.options.cms, collection: this.options.cms.users, overlay:overlay})
			user.collection.fetch();
		}
		
	});
	
	var overlayView = Backbone.View.extend({
		el : $('#overlay'),
		visable: false,
		initialize: function(){
			_.bindAll(this, 'updateContent', 'show');
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
			console.log(html)
			this.el.empty();
			this.el.append(html);
			if(typeof f === 'function') f();
		},
		show: function(){
			this.el.modal('show');
		}
	});
	
	var userPageView = _pageView.extend({
		el : $('#users')
	});
	var userRowView = _pageView.extend({});
	var userEditView = _pageView.extend({});

	BB.cmsView = cmsView;
	BB.userPageView = userPageView;
	BB.userRowView = userRowView;
	BB.userEditView = userEditView;

})(this.BB);
