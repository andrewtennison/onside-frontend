
/**
 * Module dependencies.
 */

var express 	= require('express'),
	routes 		= require('./routes'),
	everyauth 	= require('everyauth'),
	graph 		= require('fbgraph'),	
	util 		= require('util');

// Load Authentication code - doesnt need to be set to var
var onsideAuth 	= require('./lib/auth')(app);

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

// Create server	
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

app.get('/login', function(req,res){
	res.render('login', { title: 'Log In' });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
