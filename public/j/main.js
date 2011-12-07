

// BB = {} is namespace for constructors
// on = {} is namespace for instances on objects

var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

on.m = {};
on.c = {};
on.v = {};

on.env = {
	internetConnection	: true,
	server				: 'development',
	articleMax			: 20,
	touchClick			: ("ontouchstart" in window)? 'ontouchstart' : 'click'
};

on.logger = [];
on.helper = {
	// escape HTML (prevent script insertion)
	esc : function(string) {return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');}
	, log : function(msg, type){
		if (window.console === undefined || on.env.server !== 'development'){
			on.logger.push(type +' = '+ msg);
		} else {
			switch(type){
				case 'error': console.error(msg); break;
				case 'info': console.info(msg); break;
				case 'dir': console.dir(msg); break;
				case 'log':
				default: console.log(msg); break;
			}
		}
	}
}

on.path = {
	js: '/j/',
	//api: 'http://onside.mini-apps.co.uk'
	//api: 'http://api.onside.me:8000'
	api:'/api'
};

$LAB
.script( 
	on.path.js + 'lib/json2.js', 
	on.path.js + 'lib/jquery-1.6.4.min.js',
	on.path.js + 'lib/underscore-1.2.1.min.js',
	on.path.js + 'lib/backbone-0.5.3.min.js',
	on.path.js + 'lib/pretty.js'
)
.wait()
.script(
	on.path.js + 'app/models.js',
	on.path.js + 'app/collections.js'
)
.wait(function(){
	
	//_.templateSettings = { interpolate : /\{\{(.+?)\}\}/g };		
	
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
	})
})
.wait(function(){
	$(document).ready(function(){
		$LAB
		.script(on.path.js + 'app/views.js')
		.wait()
		.script(on.path.js + 'app.js');
	});
})
