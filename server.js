
/**
 * Module dependencies.
 * 
 * todo: 	- login.js - currently caching user in local object. Fetch from api. Also update findUserById - may be possible to use session
 * 			- cluster module, investigate
 * 
 */
var express			= require('express')
//	, resource		= require('express-resource')
	, RedisStore	= require('connect-redis')(express)	// redis is used for user session store
	, routes		= require('./routes')					// paths for all views
	, util			= require('util')
	, rest			= require('restler')					// restler - used for proxy API request

	// returns config for correct environment based on process.env.NODE_ENV
	, Config 		= require('./lib/conf')
	, conf			= new Config()

	// for login
	, everyauth 	= require('everyauth')
//	, graph 		= require('fbgraph')
	, login		= require('./lib/login').all(conf)
	
	// Email
	, email 		= require('./lib/email')
	;


everyauth.debug = true;

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

// Create main server
var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ 
		secret	: "testsecret",
		store	: new RedisStore({host:'127.0.0.1', port:'6379'})
	}));
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
	app.use(express.logger());
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	//app.use(express.errorHandler()); 
});


// Routes
app.get('/fb_channel', function(req,res){
	var $cache_expire = 60*60*24*365 * 1000,
		d = new Date();
    	
	d.setTime(d.getTime()+$cache_expire);
	d.toUTCString();
	
	res.header('Pragma' , 'public' );
	res.header('Cache-Control' , 'max-age=' + $cache_expire );
	res.header('Expires' , d );
	res.render('channel.ejs', {title:'facebook channel cache', cssPath: false, jsPath: false, loggedIn: false});
});


app.get('*', function(req, res, next){
	if(req.headers.host === 'test.onside.me') {
		routes.demo1();
	}else{
		next();
	}
}); 

app.get('/signup', function(req,res){
	res.render('pages/signup.ejs', { title: 'Onside Signup', cssPath: '.signup', jsPath:'.signup', loggedIn:true });
});


app.get('/', routes.index);
// app.get('/demo', routes.demo1);
// app.get('/demo2', routes.demo2);
// app.get('/login', function(req,res){ res.render('pages/login', { title: 'Log In', cssPath: '' }); });

app.get('/cms', routes.cms);

// API proxy requests
app.get('/api/*', routes.getApi);
app.post('/api/*', routes.postApi);
app.del('/api/*', routes.delApi);

app.post('/tweet', routes.tweet);

// fake call to proxy multiple calls to API 
app.get('/detail/:action?/:id?', routes.getDetailApi);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
