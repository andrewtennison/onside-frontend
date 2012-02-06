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

if(on.env.server === '!development'){
	_.template = function(str, data) {
	  console.log(str)
	  console.log(data)
	  var c  = _.templateSettings;
	  var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
	    'with(obj||{}){__p.push(\'' +
	    str.replace(/\\/g, '\\\\')
	       .replace(/'/g, "\\'")
	       .replace(c.interpolate, function(match, code) {
	         return "'," + code.replace(/\\'/g, "'") + ",'";
	       })
	       .replace(c.evaluate || null, function(match, code) {
	         return "');" + code.replace(/\\'/g, "'")
	                            .replace(/[\r\n\t]/g, ' ') + "__p.push('";
	       })
	       .replace(/\r/g, '\\r')
	       .replace(/\n/g, '\\n')
	       .replace(/\t/g, '\\t')
	       + "');}return __p.join('');";
	  console.log(tmpl.replace(/;/g, '\n')); // <- dump compiled code to console before evaluating
	  var func = new Function('obj', tmpl);
	  return data ? func(data) : func;
	};
}

window.MBP = window.MBP || {}; 
// Hide URL Bar for iOS and Android by Scott Jehl
// https://gist.github.com/1183357

MBP.hideUrlBar = function () {
	var win = window,
		doc = win.document;

	// If there's a hash, or addEventListener is undefined, stop here
	if( /*!location.hash &&*/ win.addEventListener ){

		//scroll to 1
		window.scrollTo( 0, 1 );
		var scrollTop = 1,

		//reset to 0 on bodyready, if needed
		bodycheck = setInterval(function(){
			if( doc.body ){
				clearInterval( bodycheck );
				scrollTop = "scrollTop" in doc.body ? doc.body.scrollTop : 1;
				win.scrollTo( 0, scrollTop === 1 ? 0 : 1 );
			}	
		}, 15 );

		win.addEventListener( "load", function(){
			setTimeout(function(){
				//reset to hide addr bar at onload
				win.scrollTo( 0, scrollTop === 1 ? 0 : 1 );
			}, 0);
		}, false );
	}
};

