

// BB = {} is namespace for constructors
// on = {} is namespace for instances on objects

var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

on.m = {};
on.c = {};
on.v = {};

on.path = {
	api	:'/api',
	js	: '/j/'
};
on.env = {
	docReady : false
};
on.settings = {
	sports 		: ['', 'football', 'cricket', 'tennis', 'golf', 'badminton', 'cycling'],
	channelType	: ['', 'team', 'player', 'competition', 'sponsor', 'organisation'],
	eventType	: ['', 'match', 'league', 'tournament'],
	articleTypes: ['', 'rss', 'youtube', 'twitter']
};


$LAB
.script( 
	on.path.js + 'lib/json2.js', 
	on.path.js + 'lib/jquery-1.7.1.min.js',
	on.path.js + 'lib/underscore-1.2.1.min.js'
)
.wait(function(){ $(document).ready(function(){ on.env.docReady = true; }) })
.script(
	on.path.js + 'lib/backbone-0.5.3.min.js'
)
.wait()
.script(
	on.path.js + 'cms/models.js',
	on.path.js + 'cms/collections.js',
	on.path.js + 'lib/jquery.tablesorter.min.js',
	on.path.js + 'lib/bootstrap-modal.js',
	on.path.js + 'lib/bootstrap-alerts.js',
	on.path.js + 'lib/bootstrap-buttons.js'
)
.wait(function(){
	function init(){
		$LAB
		.script(on.path.js + 'cms/views.js?' + on.env.v)
		.wait()
		.script(on.path.js + 'cms/app.js?' + on.env.v);
	};

	if(on.env.docReady){
		init();
	} else {
		$(document).ready(init);
	}

});
