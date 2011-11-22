var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	
	// For CORS / cross origin restriction
	var extendAjax = {
		beforeSend:function(xhr){
			// xhr.setRequestHeader('Origin', 'http://dev.onside.me')
			// xhr.setRequestHeader('Access-Control-Request-Method', 'POST,GET,DELETE');
			// xhr.setRequestHeader('Access-Control-Request-Headers','OnsideAuth')
			// xhr.setRequestHeader('OnsideAuth', '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b73648')
		}
	};

	var App	= Backbone.Model.extend({
		initialize: function(){
			console.info('# Model.App.initialize');
			
			_.bindAll(this, 'updateUrl', 'updateDetailedList', 'updateComments');
			
			// create + init collections for channels + events
			this.channels = new BB.ChannelList();
			this.events = new BB.EventList();
			this.detailedList = new BB.DetailList();
			this.comments = new BB.CommentList();
			
			this.bind('change:selectedUrl', this.updateUrl);
			this.bind('change:selectedModel', this.updateDetailedList);
			this.bind('change:selectedModel', this.updateComments);
		},
		defaults: {
			list: null,
			selectedUrl: null,
			selectedServiceName: null,
			selectedItemCid: null,
			selectedModel: null,
			selectedDetailId: null,
		},
		updateUrl: function(){
			this.channels.fetch();
			this.events.fetch();
		},
		updateDetailedList: function(){
			// check if model exists else add new to detailList collection
			console.info('# Model.App.updateModel');
			
			var service = this.get('selectedServiceName'),
				selectedModel = this.get('selectedModel'),
				cloneModel = selectedModel.clone(),
				currentDetailModel = this.detailedList.get( this.get('selectedDetailId') ),
				DUID = service + '|' + selectedModel.get('id'),
				existingModel = this.detailedList.get( DUID );
			
			if(currentDetailModel !== null && currentDetailModel !== undefined) currentDetailModel.set({ selected : false});
			
			if(existingModel) {
				// if exists get model
				existingModel.set({selected:true});
				this.set({selectedDetailId : DUID });
			} else {
				// else create model
				var detailModel = this.detailedList.createModel( service, cloneModel, DUID );
				this.set({selectedDetailId : DUID });
			};
		},
		updateComments: function(){
			// model changes, reset comments. Set URL then .fetch
			var newUrl = '?' + this.get('selectedServiceName') +'='+ this.get('selectedModel').id;
			alert(newUrl)
			this.comments.urlParams = url
			this.comments.fetch();
		}
	});

	var Channel = Backbone.Model.extend({
		service: 'channels',
		initialize: function(){
			console.info('# Model.Channel.initialize');
		},
		defaults: {
			selected	: false,
			service		: 'channel'
			
		// DB model structure
			// id 				: undefined,
			// name 			: undefined,
			// description 	: undefined,
			// // type 			: undefined, duplicate - is mine used, if so rename mine
			// sport 			: undefined,
			// level 			: undefined,
			// geolat 			: null,
			// geolng 			: null
		}
	});
	
	var Event = Backbone.Model.extend({
		service: 'events',
		initialize: function(){
			console.info('# Model.Event.initialize');
		},
		defaults: {
			selected	: false,
			service		: 'event'

		// DB model structure
			// service 			: undefined,
			// sport			: undefined,
			// type 			: undefined,
			// geolat			: null,
			// geolng			: null			
		}
	});
	
	var Search = Backbone.Model.extend({
		service: 'search'
	})
	
	var Detail = Backbone.Model.extend({
		// channels: null,
		// events: null,
		// articles: null,
		initialize: function(){
		},
		defaults: {
			selected: false,
			service: undefined
		}
	});

	var Article = Backbone.Model.extend({
		initialize: function(){
			//console.info('# Model.Article.initialize');
		}
	});
	
	var Comment = Backbone.Model.extend({
		initialize: function(){
			console.info('# Model.Comment.initialize');
		},
		defaults: {
			service	: 'comment',
			//id		: null,
			// article	: null,
			// channel 	: null,
			// event	: null,
			// user 	: null,
			// reply	: null,
			// comment 	: null,
			// added 	: null
		}
		
		
	});
	
	var Chat = Backbone.Model.extend({
		initialize: function(){
			console.info('# Model.Chat.initialize');
		}
	});
	
	
	// extend events for custom scenarios
	var Ev = {};
	Ev.footballMatch = Event.extend({});
	
	BB.App = App;
	BB.Channel = Channel;
	BB.Event = Event;
	BB.Search = Search;
	BB.Detail = Detail;
	BB.Article = Article;
	BB.Comment = Comment;
	BB.Chat = Chat;
	
	BB.Ev = Ev;
	
})(this.BB);
