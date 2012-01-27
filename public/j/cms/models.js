var on = window.on || {}, BB = window.BB || {}, console = window.console || {}, _ = window._ || {}; $ = window.$ || {}, Backbone = window.Backbone || {}, $LAB = window.$LAB || {};

// Onside Models
(function(BB){
	
	var CMS	= Backbone.Model.extend({
		initialize: function(route){
			console.info('# Model.App.initialize');
			var app = this;
			this.route = route;
			
			this.users = new BB.Users();
			this.channels = new BB.Channels();
			this.events = new BB.Events();
			this.sources = new BB.Sources();
			this.articles = new BB.Articles();
			
			//_.bindAll(this, );
		}
	});

	var User = Backbone.Model.extend({
		url: function(){
			return on.path.api + '/user/' + this.id;
		},
		parse: function(resp, xhr) {
			return resp.resultset.users[0];
		},
		defaultOptions: {
			id			: {type:'text', editable:false},
			name		: {type:'text'},
			email		: {type:'email'},
			admin		: {type:'select', values:[0,1]},
			enabled		: {type:'select', values:[0,1]},
			status		: {type:'select', values:[0,1,2,3,4,5,6,7,8,9]},
			password	: {type:'text'},
			twitter		: {type:'text'},
			facebook	: {type:'text'},
			google		: {type:'text'},
			language	: {type:'text'},
			added		: {type:'text'},
		}
	});
	var Channel = Backbone.Model.extend({
		parse: function(resp, xhr) {
			return resp.resultset.channels[0];
		},
		defaultOptions: {
			id			: {type:'text', editable:false},
			hash		: {type:'text'},
			name		: {type:'text'},
			image		: {type:'text'},
			description	: {type:'text'},
			sport		: {type:'select', values: on.settings.sports},
			type		: {type:'select', values: on.settings.channelType},
			level		: {type:'text'},
			keywords	: {type:'text', help:'comma separated list'},
			branding	: {type:'text', help:'hex value for brand colour'},
			geolat		: {type:'text'},
			geolng		: {type:'text'},
		},
		validate: function(attrs){
			if(attrs.name.length <= 1) return 'name required';
		}
	});
	var Event = Backbone.Model.extend({
		parse: function(resp, xhr) {
			return resp.resultset.events[0];
		},
		defaultOptions: {
			id			: {type:'text', editable:false},
			name		: {type:'text'},
			duration	: {type:'text'},
			etime		: {type:'text', help:'format: 2012-01-27 11:32:36'},
			geolat		: {type:'text'},
			geolng		: {type:'text'},
			hash		: {type:'text'},
			keywords	: {type:'text', help:'comma separated list'},
			location	: {type:'text'},
			parent		: {type:'select', values:[], help:'lookup from collection'},
			participants: {type:'text', help:'comma separated list // could be lookup + add from channels'},
			sport		: {type:'select', values: on.settings.sports},
			stime		: {type:'text', help:'format: 2012-01-27 11:32:36'},
			type		: {type:'select', values: on.settings.eventType}
		}
	});
	var Source = Backbone.Model.extend({
		parse: function(resp, xhr) {
			return resp.resultset.sources[0];
		},
		defaultOptions: {
			id			: {type:'text', editable:false},
			status		: {type:'text', editable:false},
			lastfetched	: {type:'text', editable:false},
			url			: {type:'text'},
			channels	: {type:'text', help:'comma separated list of channel IDs'},
			frequency	: {type:'text', help:'seconds, 86400 = 24hours'},
			map_type	: {type:'select', values:['', 'rss', 'youtube', 'twitter'], tableHide:true},
			map_article	: {type:'text', help:'->channel->item', tableHide:true},
			map_title	: {type:'text', help:'->title', tableHide:true},
			map_content	: {type:'text', help:'->description', tableHide:true},
			map_images	: {type:'text', tableHide:true},
			map_videos	: {type:'text', tableHide:true},
			map_author	: {type:'text', tableHide:true},
			map_source	: {type:'text', tableHide:true},
			map_link	: {type:'text', help:'->link|->guid', tableHide:true},
			map_extended: {type:'text', tableHide:true},
			map_publish	: {type:'text', help:'->pubDate', tableHide:true},
			map_keywords: {type:'text', tableHide:true}
		}
	});
	var Article = Backbone.Model.extend({
		parse: function(resp, xhr) {
			return resp.resultset.articles[0];
		},
		defaultOptions: {
			id			: {type:'text', editable:false},
			type		: {type:'select', values:on.settings.articleTypes},
			title		: {type:'text'},
			content		: {type:'text'},
			images		: {type:'text'},
			videos		: {type:'text'},
			author		: {type:'text'},
			source		: {type:'text', help:'url of source'},
			extended	: {type:'text'},
			publish		: {type:'text', editable:false},
			keywords	: {type:'text', help:'comma separated list'},
			original	: {type:'text', help:'string of originally imported data', expand:true},
		}
	});

	BB.CMS = CMS;
	BB.User = User;
	BB.Channel = Channel;
	BB.Event = Event;
	BB.Source = Source;
	BB.Article = Article;
	
})(this.BB);
