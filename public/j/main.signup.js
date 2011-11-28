

// BB = {} is namespace for constructors
// on = {} is namespace for instances on objects

var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

on.path = {
	js: '/j/'
};

$LAB
.script( 
	on.path.js + 'lib/jquery-1.6.4.min.js'
)
.wait(function(){
	$(document).ready(function(){
		$(window).bind('resize', function(){
			$('#bgImg').width($(window).width());
		});
		$(window).resize();
	});
})
