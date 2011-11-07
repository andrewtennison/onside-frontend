var cradle = require('cradle'),
    util   = require('util');

var c = new cradle.Connection('onside.iriscouch.com', 80, {
  auth: { username: 'admin', password: 'password'}
});
var users = c.database('users');

exports.findOrCreateByTwitterData = function(twitterUserData, accessToken, accessTokenSecret, promise) {
  
  console.log('1. ###################################')
  console.log(twitterUserData)


  users.view('docs/twitterId', {key: twitterUserData.id_str}, function(err, docs) {
	console.log('2. ###################################')
    console.log(err)
	console.log('3. ###################################')
    console.log(docs)
	console.log('4. ###################################')
    
    if (err) {
      console.log("Error using users/_design/docs/_view/twitterId:");
      console.log(err);
      promise.fail(err);
      return;
    }
    if (docs.length > 0) {
      var user = docs[0].value;
      console.log('user exists: ' + util.inspect(user));
      promise.fulfill(user);
    } else {
      var doc = {
        accessToken: accessToken,
        accessTokenSecret: accessTokenSecret,
        name: twitterUserData.name,
        twitterId: twitterUserData.id
      };
      c.database('users').save(doc, function(err, res) {
        if (err) {
          console.log("Error using users:");
          console.log(err);
          promise.fail(err);
          return;
        }
        console.log('user created: ' + util.inspect(doc));
        promise.fulfill(doc);
      })
    }
  });
}