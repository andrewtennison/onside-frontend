var express 	= require('express'),
	rest 		= require('restler'),
	everyauth 	= require('everyauth'),
	graph 		= require('fbgraph');




exports.all = function(conf){

  everyauth.debug = true;
  everyauth.everymodule.logoutRedirectPath('/exit');
  everyauth.everymodule.connectErrorHandling(true);

  everyauth.everymodule.handleLogout(handleLogout);

  everyauth.twitter.handleAuthCallbackError(handleOauthError);
  everyauth.facebook.handleAuthCallbackError(handleOauthError);
  everyauth.google.handleAuthCallbackError(handleOauthError);

	everyauth.twitter
		.consumerKey(conf.twit.consumerKey)
		.consumerSecret(conf.twit.consumerSecret)
		.callbackPath('/auth/twitter/callback')
		.findOrCreateUser(findOrCreateTwitterUser)
    .sendResponse(handleSuccessRedirect);

	everyauth.facebook
		.appId(conf.fb.appId)
		.appSecret(conf.fb.appSecret)
		.scope('email')
		.findOrCreateUser(findOrCreateFBUser)
    .sendResponse(handleSuccessRedirect);

	everyauth.google
		.appId(conf.google.clientId)
		.appSecret(conf.google.clientSecret)
		.scope('https://www.google.com/m8/feeds https://www.googleapis.com/auth/plus.me ')
		.findOrCreateUser(findOrCreateGoogleUser)
    .sendResponse(handleSuccessRedirect);

	everyauth
		.password
		.loginWith('email')
		.getLoginPath('/enter')
		.postLoginPath('/enter')
		.loginView('pages/0.2_signup_enter.ejs')
		.loginLocals( { title: 'Onside', cssPath: '.signup', jsPath:'.signup'})
		.authenticate(authenticateWithPassword)
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
		.registerUser(registerUser)
		.respondToLoginSucceed(function(res, user, data) {
      if(user) {
        handleSuccessRedirect.call(this, res, data);
      }
    })
		.respondToRegistrationSucceed(function (res, user, data) { handleSuccessRedirect.call(this, res, data); });

  configureAddToSession();

  return fudgeFindUserByIdFunctionMiddleware;

  ///////////////////////////////////////////////
  //Callbacks from here on down
  ///////////////////////////////////////////////
  function fudgeFindUserByIdFunctionMiddleware(req, res, next) {
    everyauth.everymodule.findUserById(function(userId,callback){
      if (userId == req.session.user.id) {
        callback(null, req.session.user);
      }
      else {
        console.log('Need to get user with id: ' + userId + ' from API');
        callback(new Error('User not found in session'), null);
      }
    });
    next();
  }

  function handleLogout(req, res) {
    if (req.session.user) {
      delete req.session.user;
    }
    req.logout();
    res.redirect('/exit');
  }

  function authenticateWithPassword(email, password, req, res) {
    var promise = this.Promise();

    var errors = [];
    if (!email) errors.push('Missing email');
    if (!password) errors.push('Missing password');
    if (errors.length) return promise.fulfill(errors);

    console.log("Posting to api: " + conf.apiPath + '/user/login');
    postToApi(conf.apiPath + '/user/login',
      { email	: email, password: password },
      getCompletionCallback(promise, getPasswordErrorHandler(promise)),
      getTimeback(promise));
    return promise;
  }

  function registerUser(newUserAttrs) {
    var promise = this.Promise();
    postToApi(conf.apiPath + '/user/register',
      newUserAttrs,
      getCompletionCallback(promise, getPasswordErrorHandler(promise)),
      getTimeback(promise));
    return promise;
  }

  function handleSuccessRedirect(res, data) {
    if (data.session.redirectTo) {
      res.redirect(data.session.redirectTo, 303);
      delete data.session.redirectTo;
    }
    else {
      res.redirect('/', 303);
    }
    res.end();
  }



  function findOrCreateTwitterUser(session, accessToken, accessSecret, twitUser, extraVars) {
    var data = {
      twitter				: twitUser.id,
      email				: 'fake.'+ twitUser.id +'@twitter.com',
      name				: twitUser.name,
      avatar      : twitUser.profile_image_url
    };
    return loginOrUpdateFromOauth.call(this, data, session.user, extraVars);
  }

  function findOrCreateFBUser(session, accessToken, accessSecret, fbUserMetadata, extraVars) {
    // everyauth.user.facebook.favorite_teams => use to improve users profile / suggest channels
    console.log('1. /////////////////////////////////////')
    var data = {
      facebook	: fbUserMetadata.id,
      email		: fbUserMetadata.email,
      name		: fbUserMetadata.name,
      avatar  : everyauth.facebook.apiHost() + '/' + fbUserMetadata.username + '/picture'
      //gender		: fbUserMetadata.gender
    };
    graph.setAccessToken(accessToken);
    return loginOrUpdateFromOauth.call(this, data, session.user, extraVars);
  }

  function findOrCreateGoogleUser(session, accessToken, accessTokenExtra, googleUser, extraVars) {
    console.log('1. /////////////////////////////////////')
    console.log(googleUser)

    googleUser.refreshToken = accessTokenExtra.refresh_token;
    googleUser.expiresIn = accessTokenExtra.expires_in;
    var data = {
      google	: googleUser.id,
      email	: googleUser.id,
      name	: googleUser.id
    };
    return loginOrUpdateFromOauth.call(this, data, session.user, extraVars);
  }

  function handleOauthError(req, res, data) {
    return res.redirect('/enter',303)
  }

  //TODO: Handle cases with conflicting details
  function loginOrUpdateFromOauth(oauthUserProps, existingUser, extraVars) {
    var url = null;
    var promise = this.Promise();
    var user = existingUser;
    if(user) {
      for (var prop in oauthUserProps) {
        if (!user[prop]) {
          user[prop] = oauthUserProps[prop];
        }
      }
      url = conf.apiPath + '/user/' + user.id;
    }
    else {
      url = conf.apiPath + '/user/login';
      user = oauthUserProps
    }

    postToApi(url, user,
      getCompletionCallback(promise, getOauthErrorHandler(promise, extraVars.req, extraVars.res)),
      getTimeback(promise));
    return promise;
  }

  function postToApi(url, data, callback, timeback) {
    var req = rest
      .post(url, { data : data })
      .on('complete', callback);
    req.request.setTimeout(conf.apiTimeout, function() {
      console.log("TIMEOUT");
      req.removeListener('complete', callback);
      timeback();
      req.request.abort();
    });
  }

  function getTimeback(promise) {
    return function() { promise.fail(['API Timeout'])};
  }

  function getPasswordErrorHandler(promise) {
    return function(errors) {
      return promise.fulfill(errors);
    }
  }

  function getOauthErrorHandler(promise, req, res) {
    return function(errors) {
      return promise.breakTo('authCallbackErrorSteps', req, res);
    }
  }

  function getCompletionCallback(promise, displayableErrorHandler) {
    return function(data, response) {
      if (response.statusCode == 200) {
        console.log('2. RESPONSE /////////////////////////////////////')
        if(data.errorset !== undefined) {
          console.log('3.ERROR /////////////////////////////////////');
          var errors = [data.errorset[0].error.message];
          return displayableErrorHandler(errors);
        }else{
          console.log('3.SUCCESS /////////////////////////////////////');
          var user = data.resultset.users[0];
          var token = data.resultset.users.token;
          if (token) user.token = token;
          promise.fulfill(user);
          return promise;
        }
      }else{
        var err = 'Error - '+ response.statusCode; // update to meaningfull error
        return promise.fail(err);
      }
    };
  }

  function configureAddToSession() {
    for (var modName in everyauth.enabled) {
      var mod = everyauth.enabled[modName];
      if (mod.addToSession) {
        //Crazy self-calling function to work round lack of proper loop scope in JS
        var handler = (function (internalAddToSession) {
          return function (session, authOrUser) {
            var user = authOrUser ? (authOrUser.user ? authOrUser.user : authOrUser) : null;
            internalAddToSession.call(this, session, authOrUser);
            if (user !== null) {
              session.user = user;
              if (user.token) {
                session.onsideToken = user.token;
                delete user.token;
              }
            }
          }
        })(mod.addToSession());
        mod.addToSession(handler);
      }
    }
  }

};
