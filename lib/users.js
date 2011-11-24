var rest = require('restler');

exports.findOrCreateByTwitterData = function(twitterUserData, accessToken, accessTokenSecret, promise) {
  
	console.log('1. ###################################')
	
	rest.post('http://onside.mini-apps.co.uk/user/login', {
		data: { 
			twitter				: twitterUserData.id,
			email				: 'fake.'+ twitterUserData.id +'@twitter.com',
			name				: twitterUserData.name,
			twitterScreenName	: twitterUserData.screen_name,
			twitterAvatarUrl	: twitterUserData.profile_image_url,
			twitterGeo			: twitterUserData.status.geo,
			twitterLang			: twitterUserData.lang
		}
	}).on('complete', function(data, response) {

		if (response.statusCode == 200) {
			console.log('twitter login success!! return promise=user');
			var user = data.resultset.users[0];
			// user.accessToken = accessToken;
			// user.accessTokenSecret = accessTokenSecret;
			// user.twitterId = user.twitter;
			// if(user.name === null) user.name = twitterUserData.name;
			
			promise.fulfill(user);
		}else{
			console.log('twitter login error!! statuscode = ' + response.statusCode);
			var err = response.statusCode; // update to meaningfull error
			promise.fail(err);
			return;
		}
	});
}