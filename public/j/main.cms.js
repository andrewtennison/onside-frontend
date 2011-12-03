

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
		var nav = $('nav'),
			list = $('section.list ul'),
			hiddenForm = $('section.hiddenForms'),
			formSection = $('section.form'),
			currentLink = false;
		
		var updateList = function(arr, service, form){
			console.log(arr);
			list.empty();
			$.each(arr, function(i,val){
				var el = $('<li id="_'+ val.id +'">'); 
				val.service = service;
				val.form = form;
				el.data('props', val);
				el.text(val.name);
				list.append(el);
			})
		};
		
		// middle list - populate form
		list.delegate('li', 'click', function(e){
			var data = $(this).data('props'),
				form = data.form;

			console.log(data);
			for(key in data){
				var input = $('input[name='+key+']',form),
					select = $('select[name='+key+']',form);
				
				if(key == 'id') {
					form.attr('data-id',data[key]);
				}else if(input.length){
					input.val(data[key]).addClass('filled');
				}else if(select.length){
					select.val(data[key]).addClass('filled');					
				}
			}
		});
		
		
		// left nav
		nav.delegate('a', 'click', function(e){
			e.preventDefault();
			var className = $(this).attr('class');
			formSection.empty();
			
			switch(className){
				case 'channels':
					var form = $('#addChannel',hiddenForm).clone();
					$.get('/api/channel', function(json){ updateList(json.resultset.channels, json.service, form) });
					formSection.append(form);
					form.submit(function(e){
						e.preventDefault();
						var id = form.attr('data-id'),
							url = (id === undefined)? form.attr('action') : form.attr('action')  +'/'+ form.attr('data-id');
						$.post(url, form.serialize(), function(d){console.log(d)});
					});
					$('a.delete', form).click(function(e){
						e.preventDefault();
						$.ajax({
							url:'/api/channel/' + form.attr('data-id'),
							type: 'DELETE',
							done: function(d){
								console.log(d);
								$('#_'+form.attr('id'),list).remove();
							},
							fail: function(d){console.error(d)}
						})
					});
					break;				
				case 'channelFollow':
					var form = $('#followChannel',hiddenForm).clone();
					$.get('/api/channel', function(json){ updateList(json.resultset.channels, json.service, form) });
					formSection.append(form);
					break;				
				case 'events':
					var form = $('#addEvent',hiddenForm).clone();
					$.get('/api/event', function(json){ updateList(json.resultset.events, json.service, form) });
					formSection.append(form);
					var part = $('.participants',form),
						el = $('span',part),
						pIndex = 0;
						
					$('.add', part).bind('click', function(){
						pIndex += 1;
						var t = el.clone();
						t.attr('id','p'+pIndex);
						part.append(t);
					});
					form.submit(function(e){
						e.preventDefault();
						var participants = []; 
						$('fieldset.participants span',form).each(function(){
							var t = $(this);
							participants.push({
								name: $('input[name=p_name]', t).val(),
								position: $('input[name=p_position]', t).val(),
								score: $('input[name=p_score]', t).val()
							});
						});
						$('fieldset.participants',form).remove();
						var data = form.serializeArray();
						data.participants = participants;

						var id = form.attr('data-id'),
							url = (id === undefined)? form.attr('action') : form.attr('action')  +'/'+ form.attr('data-id');
						
						$.post(url, data, function(d){
							console.log(d)
						});
					});
					$('a.delete', form).click(function(e){
						e.preventDefault();
						$.ajax({
							url:'/api/event/' + form.attr('data-id'),
							type: 'DELETE',
							done: function(d){
								console.log(d);
								$('#_'+form.attr('id'),list).remove();
							},
							fail: function(d){console.error(d)}
						})
					});
					break;				
				case 'users':
					var form = $('#addUser',hiddenForm).clone();
					//$.get('/api/channel', function(json){ updateList(json.resultset.channels, json.service, form) });
					formSection.append(form);
					break;
				case 'save':
					var form = $('#saveSearch',hiddenForm).clone();
					$.get('/api/search/list', function(json){ updateList(json.resultset.search, json.service, form) });
					formSection.append(form);
					break;
				default:
					break;				
			}
			if(currentLink !== false) currentLink.removeClass('on');
			$(this).addClass('on');
			currentLink = $(this);
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
