

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


on.path = {
	js: '/j/'
};


$LAB
.script( 
//	on.path.js + 'lib/json2.js', 
	on.path.js + 'lib/jquery-1.7.1.min.js'
//	on.path.js + 'lib/underscore-1.2.1.min.js',
//	on.path.js + 'lib/backbone-0.5.3.min.js',
//	on.path.js + 'lib/pretty.js',
//	on.path.js + 'lib/iscroll.js',
//	on.path.js + 'lib/mbp.helper.js',
//	'http://connect.facebook.net/en_US/all.js'
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
			
			
		});
	};

	console.log('on.env.docready = ' + on.env.docReady);
	if(on.env.docReady){
		init();
	} else {
		$(document).ready(init);
	}
});
