
/**
 * Module dependencies.
 */
var apiPath;

var express 	= require('express'),
	resource 	= require('express-resource'),   
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
	apiPath = 'http://onside.mini-apps.co.uk:80';
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
	apiPath = 'http://onside.mini-apps.co.uk:80';
});


// Routes
//app.resource('channels', require('./routes/channels'));

app.get('*', function(req, res, next){
	if(req.headers.host == 'dev2.onside.me') {
		routes.demo1();
	}else{
		next();
	}
}); 

app.get('/', routes.index);
app.get('/demo', routes.demo1);

app.get('/login', function(req,res){
	res.render('login', { title: 'Log In', cssPath: '' });
});

app.get('/addcontent', function(req,res){
	res.render('addcontent', { title: 'Add Content', cssPath: '.cms', jsPath:'.cms' });
});

var onsideAuthKey = '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b73648';

app.post('/api/search/save', routes.searchSave);

app.get('/api/search/:query', routes.searchQuery);

app.get('/api/*', routes.getApi);
app.post('/api/*', routes.postApi);
app.del('/api/*', routes.delApi);

app.post('/comment', function(req,res){
	rest.post('http://onside.mini-apps.co.uk:80/comment', req.body).on('complete', function(data){
		console.log('res.statusCode = ' + res.statusCode);
		res.json(data)
	});
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
