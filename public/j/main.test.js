

// BB = {} is namespace for constructors
// on = {} is namespace for instances of objects
var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

on.m = {};
on.c = {};
on.v = {};

on.env = {
	internetConnection	: true,
	server				: 'development',
	articleMax			: 20,
	touchClick			: ("ontouchstart" in window)? 'ontouchstart' : 'click',
	isTouch				: (function() {try { document.createEvent("TouchEvent"); return true; } catch (e) { return false; }}()),
	docReady			: false
};

console.log('1. namespace - 0.08')

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
	on.path.js + 'lib/json2.js', 
	on.path.js + 'lib/jquery-1.7.1.min.js',
	on.path.js + 'lib/underscore-1.2.1.min.js'
)
.wait()
.script(
	on.path.js + 'lib/backbone-0.5.3.min.js',
	on.path.js + 'lib/pretty.js',
	on.path.js + 'lib/iscroll.js',
//	on.path.js + 'lib/mbp.helper.js',
	'http://connect.facebook.net/en_US/all.js'
)
.wait(function(){
	console.log('3. models + collections')

	function init(){
		$(document).ready(function(){
			var left = $('#listGroups'),
				center = $('#main'),
				//detail = $('#listDetail'),
				//article = $('#listArticle'),
				right = $('#listChat');
			
			
			left.click(function(){
				console.log('left')
			});
			right.click(function(){
				console.log('right')			
			});
			center.delegate('#listDetail', 'click', function(){
				console.log('detail')			
			});		
			
			console.log(FB)
			
		});
	};

	console.log('on.env.docready = ' + on.env.docReady);
	if(on.env.docReady){
		init();
	} else {
		$(document).ready(init);
	}
});
