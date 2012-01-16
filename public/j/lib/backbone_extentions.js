// prevent conflict with .ejs backend templates
_.templateSettings = { 
	interpolate : /\<\@\=(.+?)\@\>/gim, 
	evaluate: /\<\@(.+?)\@\>/gim
};


_.extend(Backbone.Collection.prototype, Backbone.Events, {
	checkFetch : function(options){
		var collection = this;
		var local = sessionStorage.getItem(collection.name);
		if(local === null || !options.local ) {
			collection.saveFetch(options);
		}else{
			on.helper.log('load local')
			collection.reset(JSON.parse(local));
		}
	},
	saveFetch : function(options) {
		on.helper.log('saveFetch')
		options || (options = {});
		var collection = this;
		var success = options.success;
		options.success = function(resp, status, xhr) {
			collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
			if (options.save) {collection.saveLocal(collection.name,resp)}
			if (success) success(collection, resp);
		};
//			options.error = wrapError(options.error, collection, options);
		return (this.sync || Backbone.sync).call(this, 'read', this, options); 
	},
	saveLocal : function(name,data){
		on.helper.log('save local')
		sessionStorage.setItem(name,JSON.stringify(data))
	}
});

// Cached regex to split keys for `delegate`.
var eventSplitter = /^(\S+)\s*(.*)$/;

_.extend(Backbone.View.prototype, Backbone.Events, {
	delegateEvents : function(events) {
		if (!(events || (events = this.events))) return;

		if (_.isFunction(events)) events = events.call(this);
		$(this.el).unbind('.delegateEvents' + this.cid);
		for (var key in events) {
			var method = this[events[key]];				
			if (!method) throw new Error('Event "' + events[key] + '" does not exist');
			var match = key.match(eventSplitter);
			var eventName = match[1], selector = match[2];
			method = _.bind(method, this);
			
			// overide click event if touch is enabled
			if(eventName === 'click' && on.env.isTouch)	console.log('click')	//{eventName = 'ontouchstart';};
			eventName += '.delegateEvents' + this.cid;
			if (selector === '') {
				$(this.el).bind(eventName, method);
			} else {
				$(this.el).delegate(selector, eventName, method);
			}
		}
	},
});
