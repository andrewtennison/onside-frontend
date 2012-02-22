var aws 	= require("aws-lib"),
	Config 	= require('./conf'),
	conf	= new Config();

ses = aws.createSESClient(conf.aws.key, conf.aws.secret);

var recipient_address = 'please.reply@onside.me';

ses.call("GetSendQuota", {}, function(result) { console.log(JSON.stringify(result)); });
ses.call("GetSendStatistics", {}, function(result) { console.log(JSON.stringify(result)); });
ses.call("ListVerifiedEmailAddresses", {}, function(res) {
	console.log(res);	
});

exports.postFeedback = function(req,res){
	req.log.push('######### email.postFeedback');
	req.log.startTimer('EmailPost');
	
	var message = 
		'<h1>Feedback from:  '+req.body.userName+ '</h1><br><ul>'
		+'<li>User: '+req.body.userName+ '</li>'
		+'<li>User ID: '+req.body.userId+ '</li>'
		+'<li>Email: '+req.body.email+ '</li>'
		+'<li>Type: '+req.body.type+ '</li>'
		+'<li>Description: '+req.body.description+ '</li>'
		+'<li>Browser: '+req.body.browser+ '</li>'
		+'</ul>';

	var send_args = {
		'Destination.ToAddresses.member.1': recipient_address,
		'Message.Body.Html.Charset': 'UTF-8',
		'Message.Body.Html.Data': message,
		'Message.Subject.Charset': 'UTF-8',
		'Message.Subject.Data': 'Onside Feedback - ' + req.body.type,
		'Source': recipient_address //req.body.email
	};
	
	ses.call('SendEmail', send_args, function(result) {
		req.log.endEmailPost('Email.post Complete');
		if(result.error){
			// error
		}else if(result.SendEmailResult){
			// success !
		}
		res.json(result)
	});
};



