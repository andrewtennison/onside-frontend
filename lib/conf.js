module.exports = function(){
	switch(process.env.NODE_ENV){
		case 'development':
			return {
				env: 'development',
				apiPath: 'http://onside.mini-apps.co.uk:80',
				onsideAuthKey : '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b73648',
				fb: {
					appId: '266299360074356',
					appSecret: '7e10419d4070f9f96a421d46cd22dbf1'
				},
				twit: {
					consumerKey: 'K2PPhkjulGIReJQsvhsZg', 
					consumerSecret: '37km5B9zyL2YstsPh5IcmwDqZrJDK39PMNW9ytaKl8'
				},
				google: {
					clientId: '980535629632.apps.googleusercontent.com',
					clientSecret: 'dnLeRKMYgCXm1984xNej6eGX'
				}
			};
		case 'production':
			return {
				env: 'development',
				apiPath: 'http://api.onside.me',
				onsideAuthKey : '01a2e0d73218f42d1495c3670b79f1bd44d7afa316340679bcd365468b73648',
				fb: {
					appId: '273639499353915',
					appSecret: '8b002708563741e607568fdf87c34fe6'
				},
				twit: {
					consumerKey: 'eACWy9QqyIOyWUjREhh08Q', 
					consumerSecret: 'MBwdryfcLBEjiSmjkDpwli44tHvx9aMGNu5g6HMIws'
				},
				google: {
					clientId: '980535629632.apps.googleusercontent.com',
					clientSecret: 'dnLeRKMYgCXm1984xNej6eGX'
				}
			};
			
		default:
			return {error: 'no environment set, config cannot be loaded. process.env.NODE_ENV should = development OR production '}
	}
};
