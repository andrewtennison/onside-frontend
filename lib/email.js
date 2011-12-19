var aws 	= require("aws-lib"),
	Config 	= require('./conf'),
	conf	= new Config();

ses = aws.createSESClient(conf.aws.key, conf.aws.secret);

//ses.call("GetSendQuota", {}, function(result) { console.log(JSON.stringify(result)); });
//ses.call("GetSendStatistics", {}, function(result) { console.log(JSON.stringify(result)); });

var recipient_address = 'test@example.com';
var sender_address = 'test@example.com';

// ses.call("ListVerifiedEmailAddresses", {}, function(res) {
	// var addresses = res.ListVerifiedEmailAddressesResult.VerifiedEmailAddresses.member;
	// console.log(addresses);	
	// sender_address = addresses[0];
	// recipient_address = addresses[1];
// });

var send_args = {
	'Destination.ToAddresses.member.1': recipient_address,
	'Message.Body.Text.Charset': 'UTF-8',
	'Message.Body.Text.Data': 'Hello text body!',
	'Message.Body.Html.Charset': 'UTF-8',
	'Message.Body.Html.Data': '<b>Hello body!</b>',
	'Message.Subject.Charset': 'UTF-8',
	'Message.Subject.Data': 'Test subject',
	'Source': sender_address
};

// currently would fail as sender + recipient are still test as above callback not complete.
//ses.call('SendEmail', send_args, function(result) { console.log(result); });


module.exports = ses;