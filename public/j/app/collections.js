var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Collections

(function(BB){

	var _Lists = Backbone.Collection.extend({
		// overiden in extended objects
		defaultUrl:'', 
		// set when object is created in model.app
		appUrl: null, 	
		
		// extend to look for proper urls based on routing
		url: function(){
			if(this.appUrl === null){
				return this.defaultUrl;
			}else{
				alert('cant get channels because URL has changed - '+this.app.currentUrl)
				return false;
			}		
		}
	});
	
	var ChannelList = _Lists.extend({
		model : BB.Channel,
		defaultUrl: '/stubs/channels.js'
	});
	
	var EventList = _Lists.extend({
		model : BB.Event,
		defaultUrl: '/stubs/events.single.js'
	});
	
	var DetailList = Backbone.Collection.extend({
		model: BB.Detail,
		defaultUrl: function(){
			return '';
		},
		comparator: function(){
			// sort models.. by the users default order if available?
		},
		initialize: function(){
			_.bindAll(this, 'manageCollection');
			this.bind('add', this.manageCollection);
		},
		manageCollection: function(){
			console.log(this)
		}
	});
	
	var ArticleList = Backbone.Collection.extend({
		model : BB.Article,
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
	
	var CommentList = Backbone.Collection.extend({
		model : BB.Comment,
	
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
	var ChatList = Backbone.Collection.extend({});


	// Assign to BB namespace
	BB.ChannelList = ChannelList;
	BB.EventList = EventList;
	BB.DetailList = DetailList;
	BB.ArticleList = ArticleList;
	BB.CommentList = CommentList;
	BB.ChatList = ChatList;
	
})(this.BB);
