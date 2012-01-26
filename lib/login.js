var express 	= require('express'),
	rest 		= require('restler'),
	everyauth 	= require('everyauth'),
	graph 		= require('fbgraph');

everyauth.debug = true;
everyauth.everymodule.logoutRedirectPath('/exit');	


// static object will get massive over time - this should be related to users session
var usersById = {};

var resolveOnComplete = function(promise, data, response, name, service, session){
	
	if (response.statusCode == 200) {
		console.log('2. RESPONSE /////////////////////////////////////')
		//console.log(session)
		//console.log(data)
		
		if(data.errorset !== undefined) {
			console.log('3.ERROR /////////////////////////////////////')
			//console.log(data.errorset)
			var err = 'Login failed';
			promise.fail([data.errorset]);
			return promise;
		}else{
			console.log('3.SUCCESS /////////////////////////////////////')
			console.log(data.resultset)
			//console.log(data.resultset.users[0])
			var user = data.resultset.users[0];
			var token = data.resultset.users.token;
						
			if(user.name === null) user.name = name;
			if(usersById[user.id] === undefined) usersById[user.id] = user;
			
			session.onsideToken = token;
			//response.cookie('OSUID', token, { expires: 0, httpOnly: true });
			
			promise.fulfill(user);
			return promise;
		}
	}else{
		//console.log(service + ' login error!! statuscode = ' + response.statusCode);
		var err = 'Error - '+ response.statusCode; // update to meaningfull error
		promise.fail([err]);
		return promise;
	}
}

exports.all = function(conf){
	everyauth.everymodule.findUserById(function(userId,callback){
		console.log('//// lib.login.findUserById called - using local object in node to store user object, upgrade to call API / store in session!')
		callback(null, usersById[userId]);
	});
	
	everyauth.everymodule.handleLogout( function (req, res) {
		if(usersById[req.user.id]) delete usersById[req.user.id];
		res.redirect('/exit');
		req.logout(); // The logout method is added for you by everyauth, too
	});
	
	everyauth.everymodule.moduleErrback( function (err, data) {
		// Do something with the err -- e.g., log it, throw it
		console.log('Everyauth error')
		console.log(err)
		console.log(data)
		//var res = data.res;
	});
	
	everyauth.twitter
		.consumerKey(conf.twit.consumerKey)
		.consumerSecret(conf.twit.consumerSecret)
		.callbackPath('/auth/twitter/callback')
		.findOrCreateUser( function (session, accessToken, accessSecret, twitUser) {
			console.log('1. /////////////////////////////////////')
			//console.log(twitUser)
			//console.log(twitUser.name)
			
			var promise = this.Promise(),
				data = { 
					twitter				: twitUser.id,
					email				: 'fake.'+ twitUser.id +'@twitter.com',
					name				: twitUser.name
				};
			
			rest
			.post(conf.apiPath + '/user/login', { data : data })
			.on('complete', function(req, res) {
				promise = resolveOnComplete(promise, req, res, twitUser.name, 'twitter', session);
			});
			return promise;
		})
		.redirectPath('/');


	everyauth.facebook
		.appId(conf.fb.appId)
		.appSecret(conf.fb.appSecret)
		.scope('email')
		.findOrCreateUser( function (session, accessToken, accessSecret, fbUserMetadata) {
			// everyauth.user.facebook.favorite_teams => use to improve users profile / suggest channels
			console.log('1. /////////////////////////////////////')
			//console.log(fbUserMetadata)
			var promise = this.Promise(),
				data = { 
				facebook	: fbUserMetadata.id,
				email		: fbUserMetadata.email,
				name		: fbUserMetadata.name
				//gender		: fbUserMetadata.gender
			};
			
			rest.post(conf.apiPath + '/user/login', {
				data: data
			}).on('complete', function(req, res) {
				promise = resolveOnComplete(promise, req, res, fbUserMetadata.name, 'facebook', session);
			});

			graph.setAccessToken(accessToken);
			return promise;
		})
		.redirectPath('/');

	/* google scope
	 email 		: https://www.googleapis.com/auth/userinfo#email
	 profile	: https://www.googleapis.com/auth/userinfo#profile
	 g+			: https://www.googleapis.com/auth/plus.me 
	 constacts 	: https://www.google.com/m8/feeds/ 
	 not sure 	: http://www-opensocial.googleusercontent.com/api/people/

			//rest
			//.post('https://www.googleapis.com/plus/v1/people/me?pp=1&key=' + accessToken, {}) //conf.google.clientId
			//.on('complete',  function(data, response){console.log(response.statusCode) });
			

	 * */


	everyauth.google
		.appId(conf.google.clientId)
		.appSecret(conf.google.clientSecret)
		.scope('https://www.google.com/m8/feeds https://www.googleapis.com/auth/plus.me ') 
		.handleAuthCallbackError( function (req, res) {
			// if users denies access
		})
		.findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUser) {
			console.log('1. /////////////////////////////////////')
			console.log(googleUser)
			
			var promise = this.Promise();

			googleUser.refreshToken = accessTokenExtra.refresh_token;
			googleUser.expiresIn = accessTokenExtra.expires_in;

			rest.post(conf.apiPath + '/user/login', {
				data: {
					google	: googleUser.id,
					email	: googleUser.id,
					name	: googleUser.id
				}
			}).on('complete', function(data, response) {
				promise = resolveOnComplete(promise, data, response, googleUser.id, 'google');
			});
			return promise;
		})
		.redirectPath('/');
		
	everyauth
		.password
		.loginWith('email')
		.getLoginPath('/login')
		.postLoginPath('/login')
		.loginView('login.jade')
		.loginLocals( function (req, res, done) {
			setTimeout( function () {
				done(null, {
					title: 'Async login'
				});
			}, 200);
		})
		.authenticate( function (email, password) {
			console.log('email = ' + email + ' / password = '+ password);
			var promise = this.Promise()
			
			var errors = [];
			if (!email) errors.push('Missing email');
			if (!password) errors.push('Missing password');
			if (errors.length) return promise.fulfill(errors);;

			rest.post(conf.apiPath + '/user/login', {
				data: {
					email	: email,
					password: password
				}
			})
			.on('complete', function(data, response) {				
				promise = resolveOnComplete(promise, data, response, email, 'login');
			});
			return promise;
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
