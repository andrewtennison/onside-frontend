

// BB = {} is namespace for constructors
// on = {} is namespace for instances of objects
alert('! v0.1 loaded')

var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

on.m = {};
on.c = {};
on.v = {};

on.env = {
	internetConnection	: true,
	server				: 'development',
	articleMax			: 20,
	touchClick			: ("ontouchstart" in window)? 'ontouchstart' : 'click',
	isTouch				: (function() {try { document.createEvent("TouchEvent"); return true; } catch (e) { return false; }}())
};

on.logger = [];
on.helper = {
	// escape HTML (prevent script insertion)
	esc : function(string) {return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');}
	, log : function(msg, type){
		if (window.console === undefined || on.env.server !== 'development'){
			on.logger.push(type +' = '+ msg);
		} else {
			try {
				if(type === undefined) type = 'log';
				console[type](msg);
			} catch(err){
				console.error(err)
				console.log(msg)
			};
		}
	}
}

on.path = {
	js: '/j/',
	api:'/api',
	facebookCss: '//dev.onside.me:3000/c/facebook.css?1'
};

window.fbAsyncInit = function() {
	FB.init({
		appId			: '266299360074356',
		channelUrl : '//dev.onside.me:3000/fb_channel',
		status		 : true, // check login status
		cookie		 : true, // enable cookies to allow the server to access the session
		xfbml			: true	// parse XFBML
	});
};


$LAB
.script( 
	// put in head, use instead of lib.js & user modernizr.load() - libs/modernizr-custom.js
	on.path.js + 'lib/json2.js', 
	on.path.js + 'lib/jquery-1.6.4.min.js',
	on.path.js + 'lib/underscore-1.2.1.min.js',
	on.path.js + 'lib/backbone-0.5.3.min.js',
	on.path.js + 'lib/pretty.js',
	on.path.js + 'lib/iscroll.js',
	on.path.js + 'lib/mbp.helper.js',
	'http://connect.facebook.net/en_US/all.js'
)
.wait()
.script(
	on.path.js + 'app/models.js',
	on.path.js + 'app/collections.js'
)
.wait(function(){
	// Media Queries Polyfill https://github.com/h5bp/mobile-boilerplate/wiki/Media-Queries-Polyfill
	// Modernizr.mq('(min-width:0)') || document.write('<script src="js/libs/respond.min.js"><\/script>');
	
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
				
				if(key === 'click' && on.env.isTouch){
					key = 'ontouchstart';
				};

				var method = this[events[key]];
				if (!method) throw new Error('Event "' + events[key] + '" does not exist');
				var match = key.match(eventSplitter);
				var eventName = match[1], selector = match[2];
				method = _.bind(method, this);
				eventName += '.delegateEvents' + this.cid;
				if (selector === '') {
					$(this.el).bind(eventName, method);
				} else {
					$(this.el).delegate(selector, eventName, method);
				}
			}
		},
	});


})
.wait(function(){

	// iPhone Scale Bug Fix, read this when using http://www.blog.highub.com/mobile-2/a-fix-for-iphone-viewport-scale-bug/
	window.onload = function() { MBP.scaleFix(); }

	$(document).ready(function(){
		if(iScroll) $('body').addClass('iScrollEnabled');
	
		$LAB
		.script(on.path.js + 'app/views.js')
		.wait()
		.script(on.path.js + 'app.js');
	});
})
