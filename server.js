
/**
 * Module dependencies.
 */

var express 	= require('express'),
	routes 		= require('./routes'),
	everyauth 	= require('everyauth'),
	graph 		= require('fbgraph'),	
	util 		= require('util'),
	rest 		= require('restler');
    
// Load Authentication code - doesnt need to be set to var
var onsideAuth 	= require('./lib/auth')(app);

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});


// Create main server
var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
	app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret : "changeToSomething!"}));
	app.use(express.methodOverride());
	app.use(everyauth.middleware());
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
	everyauth.helpExpress(app);
});

app.configure('development', function(){
	app.use(express.logger());
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});


// Routes
app.get('/', routes.index);
app.get('/events', routes.index);

app.get('/login', function(req,res){
	res.render('login', { title: 'Log In' });
});

app.get('/addcontent', function(req,res){
	res.render('addcontent', { title: 'Add Content' });
});

var onsideAuthKey = '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b73648';
app.get('/channel', function(req,res){
	rest.get('http://onside.mini-apps.co.uk:80/channel',{
		headers:{
			OnsideAuth : onsideAuthKey,
			'OnsideAuth' : onsideAuthKey
		}
	}).on('complete', function(data) {
		res.json(data);
	});
	console.log(rest)
});
app.get('/event', function(req,res){
	rest.get('http://onside.mini-apps.co.uk:80/event',{
		headers:{
			OnsideAuth : onsideAuthKey,
			Origin: 'http://dev.onside.me:1234',
			'Access-Control-Request-Method' : 'POST,GET,DELETE',
			'Access-Control-Request-Headers': 'OnsideAuth'
		}
	}).on('complete', function(data) {
		res.json(data);
	});
});
app.get('/article', function(req,res){
	rest.get('http://onside.mini-apps.co.uk:80/article',{
		headers:{
			OnsideAuth : onsideAuthKey,
			Origin: 'http://dev.onside.me:1234',
			'Access-Control-Request-Method' : 'POST,GET,DELETE',
			'Access-Control-Request-Headers': 'OnsideAuth'
		}
	}).on('complete', function(data) {
		res.json(data);
	});
});
app.get('/search/:query', function(req,res){
	console.log(req.params.query);
	rest.get('http://onside.mini-apps.co.uk:80/search?' + req.params.query,{
		headers:{
			OnsideAuth : onsideAuthKey,
			Origin: 'http://dev.onside.me:1234',
			'Access-Control-Request-Method' : 'POST,GET,DELETE',
			'Access-Control-Request-Headers': 'OnsideAuth'
		}
	}).on('complete', function(data) {
		res.json(data);
	});
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
