var express 	= require('express'),
	rest 		= require('restler'),
	everyauth 	= require('everyauth'),
	graph 		= require('fbgraph');

everyauth.debug = true;
everyauth.everymodule.logoutRedirectPath('/exit');


var resolveOnComplete = function(promise, data, response){

	if (response.statusCode == 200) {
		console.log('2. RESPONSE /////////////////////////////////////')

		if(data.errorset !== undefined) {
			console.log('3.ERROR /////////////////////////////////////');
      if (service == 'login') {
			  promise.fulfill([data.errorset[0].error.message]);
      }
      else {
        promise.fail([data.errorset[0].error.message])
      }
      return promise;
		}else{
			console.log('3.SUCCESS /////////////////////////////////////');
			var user = data.resultset.users[0];
      var token = data.resultset.users.token;
      user.token = token;
			promise.fulfill(user);
			return promise;
		}
	}else{
		var err = 'Error - '+ response.statusCode; // update to meaningfull error
		console.log(err);
    promise.fail(err);
		return promise;
	}
};



exports.all = function(conf){

  //TODO: Handle cases with conflicting details
  function loginOrUpdateFromOauth(oauthUserProps, existingUser) {
    var url = null;
    var promise = everyauth.everymodule.Promise();
    if(existingUser) {
      for (var prop in oauthUserProps) {
        if (!existingUser[prop]) {
          existingUser[prop] = oauthUserProps[prop];
        }
      }
      url = conf.apiPath + '/user/' + existingUser.id;
    }
    else {
      url = conf.apiPath + '/user/login';
      existingUser = oauthUserProps
    }
    console.log(url);
    rest
      .post(url, { data : existingUser })
      .on('complete', function(data, res) {
        resolveOnComplete(promise, data, res);
      });
    return promise;
  }

  everyauth.everymodule.handleLogout( function (req, res) {
		if (req.session.user) {
      delete req.session.user;
    }
    req.logout();
		res.redirect('/exit');
	});

	everyauth.everymodule.moduleErrback( function (err) {
		// Do something with the err -- e.g., log it, throw it
		console.log('Everyauth error');
		console.log(err);
    throw(new Error(err));
		//var res = data.res;
	});

	everyauth.twitter
		.consumerKey(conf.twit.consumerKey)
		.consumerSecret(conf.twit.consumerSecret)
		.callbackPath('/auth/twitter/callback')
		.findOrCreateUser( function (session, accessToken, accessSecret, twitUser) {

		  var data = {
          twitter				: twitUser.id,
          email				: 'fake.'+ twitUser.id +'@twitter.com',
          name				: twitUser.name
        };
      return loginOrUpdateFromOauth(data, session.user);
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
			var data = {
				facebook	: fbUserMetadata.id,
				email		: fbUserMetadata.email,
				name		: fbUserMetadata.name
				//gender		: fbUserMetadata.gender
			};
      graph.setAccessToken(accessToken);
      return loginOrUpdateFromOauth(data, session.user);
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
      var data = {
        google	: googleUser.id,
        email	: googleUser.id,
        name	: googleUser.id
      };
      return loginOrUpdateFromOauth(data, session.user);
		})
		.redirectPath('/');

	everyauth
		.password
		.loginWith('email')
		.getLoginPath('/enter')
		.postLoginPath('/enter')
		.loginView('pages/0.2_signup_enter.ejs')
		.loginLocals( { title: 'Onside', cssPath: '.signup', jsPath:'.signup'})
		.authenticate( function (email, password, req, res) {
			console.log('email = ' + email + ' / password = '+ password);
			var promise = this.Promise();

			var errors = [];
			if (!email) errors.push('Missing email');
			if (!password) errors.push('Missing password');
			if (errors.length) return promise.fulfill(errors);

      console.log("Posting to api: " + conf.apiPath + '/user/login');
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

		.getRegisterPath('/signup')
		.postRegisterPath('/signup')
		.registerView('pages/0.0_signup.ejs')
    .registerLocals({ title: 'Onside', cssPath: '.signup', jsPath:'.signup' })
    .extractExtraRegistrationParams(function(req){
      return {admin:0, status:0, enabled:0, language:'en_gb'}
      })
		.validateRegistration( function (newUserAttrs, errors) {
			console.log('? validateRegistration');
			return _.without(errors, 'Missing password');
		})
		.registerUser( function (newUserAttrs) {
			console.log('? registerUser')
			console.log(newUserAttrs)
      var promise = this.Promise();
      rest.post(conf.apiPath + '/user/register', {
        data: newUserAttrs
      })
      .on('complete', function(data, response) {
        promise = resolveOnComplete(promise, data, response, newUserAttrs.email, 'register');
      });
      return promise;
		})

		.loginSuccessRedirect('/')
		.registerSuccessRedirect('/');

  for(var modName in everyauth.enabled) {
    var mod = everyauth.enabled[modName];
    if (mod.addToSession) {
      //Crazy self-calling function to work round lack of proper loop scope in JS
      var handler = (function(internalAddToSession) {
        return function(session, authOrUser) {
          var user = authOrUser ? (authOrUser.user ? authOrUser.user : authOrUser) : null;
          internalAddToSession.call(this, session, authOrUser);
          if (user !== null) {
            session.user = user;
            session.onsideToken = user.token;
          }
        }
      })(mod.addToSession());
      mod.addToSession(handler);
    }
  }



  return function(req, res, next) {
    everyauth.everymodule.findUserById(function(userId,callback){
      if (userId == req.session.user.id) {
        callback(null, req.session.user);
      }
      else {
        console.log('Need to get user with id: ' + userId + ' from API');
        callback(['Fucked'], null)
      }
    });
    next();
  };
};
