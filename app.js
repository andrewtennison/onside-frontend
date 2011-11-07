
/**
 * Module dependencies.
 */

var express 	= require('express'),
	routes 		= require('./routes'),
	everyauth 	= require('everyauth'),
	util 		= require('util');
//	users    	= require('./lib/users');

everyauth.twitter
	.consumerKey('K2PPhkjulGIReJQsvhsZg')
	.consumerSecret('37km5B9zyL2YstsPh5IcmwDqZrJDK39PMNW9ytaKl8')
	.findOrCreateUser(function(session, accessToken, accessTokenSecret, twitterUserData){
		var promise = this.Promise();
		users.findOrCreateByTwitterData(twitterUserData, accessToken, accessTokenSecret, promise);
		return promise;
		//return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
	})
	.redirectPath('/');

	
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret : "123456"}));
  app.use(everyauth.middleware());
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  everyauth.helpExpress(app);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.get('/login', function(req,res){
	res.render('login', { title: 'Log In' });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
