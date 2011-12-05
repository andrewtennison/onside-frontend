var express 	= require('express'),
	rest 		= require('restler'),
	everyauth 	= require('everyauth'),
	graph 		= require('fbgraph');

// static object will get massive over time - this should be related to users session
var usersById = {};

var resolveOnComplete = function(promise, data, response, name, service){
	
	if (response.statusCode == 200) {
		console.log( service + ' login success!! return promise=user');
		console.log(data)
		console.log(data.resultset.users[0])
		
		var user = data.resultset.users[0];
		
		// if(user.enabled === '0') {
			// var err = 'Thank you for signing up with Onside. You currently dont have access to private beta';
			// //promise.fulfill([err]);
			// promise.fail(err);
			// return promise;
		// }else{
			if(user.name === null) user.name = name;
			if(usersById[user.id] === undefined) usersById[user.id] = user;
			
			promise.fulfill(user);
			return promise;
		// }
	}else{
		console.log(service + ' login error!! statuscode = ' + response.statusCode);
		var err = 'Error - '+ response.statusCode; // update to meaningfull error
		promise.fail(err);
		//promise.fulfill([err]);
		return promise;
	}
}

exports.all = function(conf){
	
	everyauth.everymodule.findUserById(function(userId,callback){
		callback(null, usersById[userId]);
	});
	
	everyauth.twitter
		.consumerKey(conf.twit.consumerKey)
		.consumerSecret(conf.twit.consumerSecret)
		.callbackPath('/auth/twitter/callback')
		.findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
			var promise = this.Promise();
			
			rest.post(conf.apiPath + '/user/login', {
				data: { 
					twitter				: twitUser.id,
					email				: 'fake.'+ twitUser.id +'@twitter.com',
					name				: twitUser.name,
					twitterScreenName	: twitUser.screen_name,
					twitterAvatarUrl	: twitUser.profile_image_url,
					twitterGeo			: twitUser.status.geo,
					twitterLang			: twitUser.lang
				}
			}).on('complete', function(data, response) {
				promise = resolveOnComplete(promise, data, response, twitUser.name, 'twitter');
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
			console.log(fbUserMetadata)
			var promise = this.Promise();
			
			rest.post(conf.apiPath + '/user/login', {
				data: { 
					facebook	: fbUserMetadata.id,
					email		: fbUserMetadata.email,
					name		: fbUserMetadata.name,
					gender		: fbUserMetadata.gender
				}
			}).on('complete', function(data, response) {
				promise = resolveOnComplete(promise, data, response, fbUserMetadata.name, 'facebook');
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
