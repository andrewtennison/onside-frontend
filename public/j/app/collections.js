var on = window.on || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Collections

var Lists = Backbone.Collection.extend({
	defaultUrl:'',
	url: function(){
		if(this.app.get('currentUrl') === null){
			return this.defaultUrl;
		}else{
			alert('cant get channels because URL has changed - '+this.app.currentUrl)
			return false;
		}		
	},
	
	initialize: function(){
		console.info('# Collection.List.initialize + fetch');
		
		_.bindAll(this, 'update');
		this.app = on.m.app;
		this.app.bind('change:currentUrl', this.update);
		
		this.fetch();
	},
	
	update: function(){
		console.log('! Collection.List.update: new URL reset collection');
		this.fetch();
	}	
});

on.ChannelList = Lists.extend({
	model : on.Channel,
	defaultUrl: '/stubs/channels.js'
});

on.EventList = Lists.extend({
	model : on.Event,
	defaultUrl: '/stubs/events.single.js'
});

on.DetailList	= Backbone.Collection.extend({});

on.ArticleList 	= Backbone.Collection.extend({
	model : on.Article,
	url : function(opts){
		var twitterUsername = false,
			blockTerms = false,
			searchTerms = opts.keywords.replace(' ','+').replace(',','%2c');
			url = 'http://pipes.yahoo.com/pipes/pipe.run?';
			
		//if(blockTerms) url += 'BlockTerm%28s%29='+blockTerms+'&';
		if(searchTerms) url += '&SearchFor='+searchTerms+'&';
		//if(twitterUsername) url += '&Twittername=' +twitterUsername+ '.rss&';
		url += '_id=b9b673bf19353ce78c8912180c1b414e&_render=json';

		return url;
	},

	filterJSON : function(JSON){
		_.each(JSON,function(num,key){
			var J = JSON[key];
			if(J.pubDate || J.publishedDate) J['o_date'] = J.publishedDate || J.pubDate;

			var text = $('<span>'+J.description+'</span>').text();
			if(text.length > 200){
				J['o_shortDesc'] = text.slice(0,140);
				J['o_longDesc'] = J.description;
				J['o_readMore'] = true;
			}else{
				J['o_shortDesc'] = J.description;
				J['o_longDesc'] = J.description;
				J['o_readMore'] = false;
			}
			if ( J['media:content'] ) {
				if( J['media:content'].type === 'image/jpeg'){
					J['o_img'] = {
						width: J['media:content'].width,
						height: J['media:content'].height,
						url: J['media:content'].url
					}
				}else if(_.isArray(J['media:content']) && J['media:content'][0].type === 'image/jpeg'){
					J['o_img'] = {
						width: J['media:content'][0].width,
						height: J['media:content'][0].height,
						url: J['media:content'][0].url
					}
				}
			}
		});
		return JSON;
	},

	
	fetchRSS : function(options){
		var collection = this,
			url = this.url(options);
		
		$.getJSON(url,function(data){
			var content = collection.filterJSON( data.value.items );
			collection.reset(content);
		});
	}
});

on.CommentList 	= Backbone.Collection.extend({
	model : on.Comment,

	url : function(opts){
		var searchTerm = opts.keywords; 
		return 'http://search.twitter.com/search.json?q='+encodeURIComponent(searchTerm)+'&result_type=mixed&count=20&callback=?';
	},

	comparator : function(Comment) {
		return Comment.get("created_at");
	},

	fetchRSS : function(options){
		var collection = this,
			url = this.url(options);
			
		$.getJSON(url,function(data){
			//console.info(data)
			collection.reset(data.results);
		});
	}
});
on.ChatList 	= Backbone.Collection.extend({});

