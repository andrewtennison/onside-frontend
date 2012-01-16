

// BB = {} is namespace for constructors
// on = {} is namespace for instances of objects
var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

on.m = {};
on.c = {};
on.v = {};

on.env = {
	v					: 0.18,
	internetConnection	: true,
	server				: 'development',
	articleMax			: 20,
	touchClick			: ("ontouchstart" in window)? 'ontouchstart' : 'click',
	isTouch				: (function() {try { document.createEvent("TouchEvent"); return true; } catch (e) { return false; }}()),
	docReady			: false
};

console.log('1. namespace - ' + on.env.v)

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
		appId		: '266299360074356',
		channelUrl	: '//dev.onside.me:3000/fb_channel',
		status		: true, // check login status
		cookie		: true, // enable cookies to allow the server to access the session
		xfbml		: true	// parse XFBML
	});
};

$LAB
.script( 
	// put in head, use instead of lib.js & user modernizr.load() - libs/modernizr-custom.js
	on.path.js + 'lib/json2.js', 
	on.path.js + 'lib/jquery-1.7.1.min.js',
	on.path.js + 'lib/underscore-1.2.1.min.js'
)
.wait(function(){
	$(document).ready(function(){ on.env.docReady = true; })
})
.script(
	on.path.js + 'lib/backbone-0.5.3.min.js',
	on.path.js + 'lib/pretty.js',
	on.path.js + 'lib/iscroll.js',
	'http://connect.facebook.net/en_US/all.js'
//	on.path.js + 'lib/mbp.helper.js',
)
.wait()
.script(
	on.path.js + 'lib/backbone_extensions.js?' + on.env.v,
	on.path.js + 'app/models.js?' + on.env.v,
	on.path.js + 'app/collections.js?' + on.env.v
)
.wait(function(){
	// Media Queries Polyfill https://github.com/h5bp/mobile-boilerplate/wiki/Media-Queries-Polyfill
	// Modernizr.mq('(min-width:0)') || document.write('<script src="js/libs/respond.min.js"><\/script>');
	console.log('3. models + collections')

	console.log('4. helpers')

	// iPhone Scale Bug Fix, read this when using http://www.blog.highub.com/mobile-2/a-fix-for-iphone-viewport-scale-bug/
	function init(){
		console.log('5. doc ready')

		if(iScroll) $('body').addClass('iScrollEnabled');

		$LAB
		.script(on.path.js + 'app/views.js?' + on.env.v)
		.wait()
		.script(on.path.js + 'app.js?' + on.env.v)
		.wait(function(){console.log('6. app loaded')});

		/*
		
		MBP.scaleFix(); 
		MBP.hideUrlBar();
	
		*/
			
	};

	console.log('on.env.docready = ' + on.env.docReady);
	if(on.env.docReady){
		init();
	} else {
		$(document).ready(init);
	}
});