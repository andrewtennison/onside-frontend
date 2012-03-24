// prevent conflict with .ejs backend templates
_.templateSettings = { 
	interpolate : /\<\@\=(.+?)\@\>/gim, 
	evaluate: /\<\@(.+?)\@\>/gim
};


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

// serializes to a json object rather than an array of objects
$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

$.fn.convertToObject = function(val){
	var t = val.split(/\}\,\s?{/g),
		i = 0, 
		l = t.length, 
		arr = [];
		
	for(i; i<l; i++){ 
	    var tmp = t[i].replace(/\{|\}/g,'').split(','),
	    	j = 0, ll = tmp.length,
	    	obj = {};

	    for(j; j<ll; j++){
	        var tmp2 = tmp[j].replace(' ','').split(':');
	        obj[ tmp2[0] ] = tmp2[1];
	    }
	    arr.push(obj)
	};
	return arr;
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


///////////////////////////////////////////////

/*
.fetch
	- get from local, if exists load
	- get from server, save to local / update local, update
	- sync with collection / model
 
 * */


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









// Backbone.sync
// -------------
// Backbone.ajaxSync;
// Backbone.LocalStorage.sync;

/*
Backbone.sync = function(method, model, options) {
	
//	console.log(options.success)
//	Backbone.ajaxSync(method, model, options);
	
Backbone.LocalStorage.sync(method, model, options);
  // if (resp) {
    // options.success(resp);
  // } else {
    // options.error("Record not found");
  // }

};

get
- get local > return
- get ajax > save local
- ajax > return / update




Backbone.sync = function Sync() {
	console.log(arguments[0]);
	console.log(this);
	
	var localArguments = _.clone(arguments);
	
	switch(arguments[0]){
		case 'read':
		break;
		case 'create':
		return Backbone.ajaxSync.apply(this, arguments);

		case 'update':
		return Backbone.ajaxSync.apply(this, arguments);
		
		case 'delete':
		return Backbone.ajaxSync.apply(this, arguments);
	}	

    var success = arguments[2].success;
    
    localArguments.success = function( data ){
    	console.info('Local success')
    	console.log(data)
    	if( data.length ) success(data);
    }

    arguments[2].success = function( data ){
    	console.info('AJAX success')
    	console.log(data)
		switch(arguments[0]){
			case 'read':
			localStorage().setItem(this.name);
			break;
		}	
    	if( typeof data == 'object' ) success(data);
    }

    
    
    return Backbone.ajaxSync.apply(this, arguments);
//    return Backbone.localSync.apply(this, localArguments);
};
*/

Backbone.sync = Backbone.ajaxSync











