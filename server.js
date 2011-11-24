
/**
 * Module dependencies.
 */

var express 	= require('express'),
	routes 		= require('./routes'),
	util 		= require('util'),
	rest 		= require('restler'),

	// for Auth
	everyauth 	= require('everyauth'),
	graph 		= require('fbgraph'),	
	login		= require('./lib/login');

everyauth.debug = true;

// manages all login scripts
login.all()


process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});


// Create main server
var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
	//app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret : "changeToSomething!"}));
	app.use(express.methodOverride());
	app.use(everyauth.middleware());
	app.use(app.router);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
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
app.get('*', function(req, res, next){
	if(req.headers.host == 'dev2.onside.me') {
		routes.demo1();
	}else{
		next();
	}
}); 

app.get('/', routes.index);
app.get('/demo', routes.demo1);

app.get('/events', routes.index);

app.get('/login', function(req,res){
	res.render('login', { title: 'Log In', cssPath: '' });
});

app.get('/addcontent', function(req,res){
	res.render('addcontent', { title: 'Add Content', cssPath: '' });
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
app.get('/comment', function(req,res){
	rest.get('http://onside.mini-apps.co.uk:80' + req.url ,{
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
app.post('/comment', function(req,res){
	rest.post('http://onside.mini-apps.co.uk:80/comment', req.body).on('complete', function(data){
		console.log('res.statusCode = ' + res.statusCode);
		res.json(data)
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
