

// BB = {} is namespace for constructors
// on = {} is namespace for instances on objects

var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

on.path = {
	js: '/j/'
};

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-27180824-1'],['_setDomainName', 'onside.me'],['_trackPageview']);

$LAB
.script( 
	'http://www.google-analytics.com/ga.js',
	'http://code.jquery.com/jquery-1.7.1.min.js'
)
.wait(function(){
	$(document).ready(function(){

		// for ios homeScreen app - should prevent safari opening
		$('a').live('click', function (e) {      
		    var href = $(this).attr("href");
		    if (href.indexOf(location.hostname) > -1) {
		        e.preventDefault();
		        window.location = href;
		    }
		});
	});
})
