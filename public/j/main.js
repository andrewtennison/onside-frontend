if(window.console && (!(/dev.onside.me/gi).test(document.location.href) || !(/debug=true/gi).test(document.location.href)) ){
	// use console
}else{
	var console = {
		log:function(){},
		dir:function(){},
		info:function(){},
		error:function(){},
	};
}


// BB = {} is namespace for constructors
// on = {} is namespace for instances of objects
var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// models, collections, views
on.m = {};
on.c = {};
on.v = {};

on.env = {
	v					: 0.19,
	internetConnection	: true,
	server				: 'development',
	articleMax			: 20,
	touchClick			: ("ontouchstart" in window)? 'ontouchstart' : 'mousedown',
	isTouch				: (function() {try { document.createEvent("TouchEvent"); return true; } catch (e) { return false; }}()),
	docReady			: false,
	appleMob			: (/iphone|ipad/gi).test(window.navigator.userAgent)
};
on.env.twitterKey = (on.env.server === 'development')? 'K2PPhkjulGIReJQsvhsZg' : 'eACWy9QqyIOyWUjREhh08Q';

on.settings = {
	sports 			: ['football', 'rugby union', 'rugby league', 'cricket', 'tennis', 'golf', 'badminton', 'cycling', 'archery','other'],
	channelType		: ['sport','team', 'player', 'competition', 'sponsor', 'organisation','other'],
	eventType		: ['match', 'league', 'tournament','other'],
	articleTypes	: ['rss', 'youtube', 'twitter','other'],
	channelStatus	: ['active', 'hidden']
};

on.logger = [];
on.helper = {};
on.helper.esc = function(string) {return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');}
on.helper.log = function(msg,type){ console.log(msg) };

if( !( /dev.onside.me/gi ).test(document.location.href) || window.console === undefined ) {
	var addToLog = function( msg ){ on.logger.push( msg ) };
	window.console = {};
	console.log = console.info = console.dir = console.error = addToLog;
}

on.path = {
	js: '/j/',
	api:'/api',
	facebookCss: '//dev.onside.me:3000/c/facebook.css?1'
};

// google analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-27180824-1'],['_setDomainName', 'onside.me'],['_trackPageview']);

// Facebook setup
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
	'http://www.google-analytics.com/ga.js',
	'http://platform.twitter.com/anywhere.js?id=' + on.env.twitterKey + '&v=1',
	'http://connect.facebook.net/en_US/all.js',
	//'http://code.jquery.com/jquery-1.7.1.min.js',  	
	on.path.js + 'lib/jquery-1.7.1.min.js',
	on.path.js + 'lib/json2.js', 
	on.path.js + 'lib/underscore-1.3.1.min.js'
)
.wait(function(){
	$(document).ready(function(){ on.env.docReady = true; })
})
.script(
	on.path.js + 'lib/backbone-0.9.1.min.js',
	on.path.js + 'lib/backbone.localStorage.js',
	on.path.js + 'lib/pretty.js',
	on.path.js + 'lib/iscroll.js'
)
.wait()
.script(
	on.path.js + 'lib/backbone_extentions.js?' + on.env.v,
	on.path.js + 'app/models.js?' + on.env.v,
	on.path.js + 'app/collections.js?' + on.env.v
)
.wait(function(){
	// Media Queries Polyfill https://github.com/h5bp/mobile-boilerplate/wiki/Media-Queries-Polyfill
	// Modernizr.mq('(min-width:0)') || document.write('<script src="js/libs/respond.min.js"><\/script>');
	// iPhone Scale Bug Fix, read this when using http://www.blog.highub.com/mobile-2/a-fix-for-iphone-viewport-scale-bug/
	
	function init(){
		//MBP.hideUrlBar();

		if(iScroll) $('body').addClass('iScrollEnabled');

		$LAB
		.script(on.path.js + 'app/views.js?' + on.env.v)
		.wait()
		.script(on.path.js + 'app/app.js?' + on.env.v)
		.wait(function(){console.log('1. app loaded')});
	};

	on.env.docReady? init() : $(document).ready(init);

});