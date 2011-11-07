module.exports = function(app){
	
	var everyauth 	= require('everyauth'),
		conf 		= require('./conf'),
		graph 		= require('fbgraph');

	
	everyauth.debug = true;
	
	var usersById = {};
	var nextUserId = 0;
	
	function addUser (source, sourceUser) {
		console.log('///// Add user')
	
		var user;
		if (arguments.length === 1) { // password-based
			user = sourceUser = source;
			user.id = ++nextUserId;
			user.name = user.email;
			return usersById[nextUserId] = user;
		} else { // non-password-based
			user = usersById[++nextUserId] = {id: nextUserId};
			user[source] = sourceUser;
			
			// add generic username value to access on frontend
			if(user[source].name){ user.name = user[source].name; } 
			else if(user[source].email){ user.name = user[source].email; }
			else if(user[source].id){ user.name = user[source].id; }
		}
		return user;
	}
	var usersByFbId = {};
	var usersByTwitId = {};
	var usersByGoogleId = {};
	var usersByLogin = {
		'brian@example.com': addUser({ login: 'brian@example.com', password: 'password'})
	};
	
	everyauth.everymodule.findUserById( function (id, callback) {
		callback(null, usersById[id]);
	});
	
	everyauth.facebook
		.appId(conf.fb.appId)
		.appSecret(conf.fb.appSecret)
		.scope('email')
		.findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
			// everyauth.user.facebook.favorite_teams => use to improve users profile / suggest channels
			graph.setAccessToken(access_token);
			return usersByFbId[fbUserMetadata.id] || (usersByFbId[fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
		})
		.redirectPath('/');
	
	everyauth.twitter
		.consumerKey(conf.twit.consumerKey)
		.consumerSecret(conf.twit.consumerSecret)
		.findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
			return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
		})
		.redirectPath('/');
	
	everyauth.google
		.appId(conf.google.clientId)
		.appSecret(conf.google.clientSecret)
		.scope('https://www.google.com/m8/feeds/')
		.findOrCreateUser( function (sess, accessToken, extra, googleUser) {
			googleUser.refreshToken = extra.refresh_token;
			googleUser.expiresIn = extra.expires_in;
			return usersByGoogleId[googleUser.id] || (usersByGoogleId[googleUser.id] = addUser('google', googleUser));
		})
		.redirectPath('/');
	
	everyauth
		.password
		.loginWith('email')
		.getLoginPath('/login')
		.postLoginPath('/login')
		.loginView('login.jade')
	//	.loginLocals({
	//		title: 'Login'
	//	})
	//	.loginLocals(function (req, res) {
	//		return {
	//		title: 'Login'
	//		}
	//	})
		.loginLocals( function (req, res, done) {
			setTimeout( function () {
				done(null, {
					title: 'Async login'
				});
			}, 200);
		})
		.authenticate( function (login, password) {
			var errors = [];
			if (!login) errors.push('Missing login');
			if (!password) errors.push('Missing password');
			if (errors.length) return errors;
			var user = usersByLogin[login];
			if (!user) return ['Login failed'];
			if (user.password !== password) return ['Login failed'];
			
			console.log(user)
			return user;
		})
	
		.getRegisterPath('/register')
		.postRegisterPath('/register')
		.registerView('register.jade')
	//	.registerLocals({
	//	  title: 'Register'
	//	})
	//	.registerLocals(function (req, res) {
	//	  return {
	//		title: 'Sync Register'
	//	  }
	//	})
		.registerLocals( function (req, res, done) {
		  setTimeout( function () {
				done(null, {
			 		title: 'Async Register'
				});
			}, 200);
		})
		.validateRegistration( function (newUserAttrs, errors) {
			console.log('? validateRegistration')
			var login = newUserAttrs.login;
			if (usersByLogin[login]) errors.push('Login already taken');
			return errors;
		})
		.registerUser( function (newUserAttrs) {
			console.log('? registerUser')
			console.log(newUserAttrs)
			var login = newUserAttrs[this.loginKey()];
			return usersByLogin[login] = addUser(newUserAttrs);
		})
	
		.loginSuccessRedirect('/')
		.registerSuccessRedirect('/');
};