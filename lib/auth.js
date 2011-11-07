everyauth.debug = true;

var usersById = {};
var nextUserId = 0;

function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
  return user;
}
var usersByTwitId = {};

everyauth.twitter
	.consumerKey('K2PPhkjulGIReJQsvhsZg')
	.consumerSecret('37km5B9zyL2YstsPh5IcmwDqZrJDK39PMNW9ytaKl8')
	.findOrCreateUser(function(sess, accessToken, accessSecret, twitUser){
		var promise = new Promise();
		users.findOrCreateByTwitterData(twitUser, promise);
		return promise;
		//return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
	})
	.redirectPath('/');
