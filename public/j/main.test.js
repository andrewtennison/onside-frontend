

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
})

/*
 var data = { id: '2',
  email: 'fake.52349587@twitter.com',
  twitter: '52349587',
  admin: '1',
  enabled: '1',
  status: '1' };

var data2 = 'twitter=52349587&facebook=&enabled=1&status=1'

$.post('http://api.onside.me/user/2', data ,function(res){
console.log(res)
});

 * */
