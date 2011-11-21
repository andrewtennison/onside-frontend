var http = require('http'),
    httpProxy = require('http-proxy');
//
// Create your proxy server
//
httpProxy.createServer(9000, 'localhost').listen(8000);

//
// Create your target server
//
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, true, 2));
  res.end();
}).listen(9000);


// 1 - redirects dev.onside.me:800 to dev.onside.me:3000
httpProxy.createServer(3000, 'localhost').listen(8000);

// 2 - same but does some logic before
httpProxy.createServer(function (req, res, proxy) {
	console.log(req)
	console.log(res)
	console.log(proxy)

	proxy.proxyRequest(req, res, {
		host: 'localhost',
		port: 3000
	});
}).listen(8000);

// 3 -
// Proxy Server
var proxyOptions = {
	router:{
		'dev.onside.me' : 'dev.onside.me:3000',
		'api.onside.me/event' : 'onside.mini-apps.co.uk/event',
		'api.onside.me/channel' : 'onside.mini-apps.co.uk/channel'
	}
}
var proxyServer = httpProxy.createServer(proxyOptions);
proxyServer.listen(80);


httpProxy.createServer(3000, 'localhost').listen(8001);

var proxy = new httpProxy.RoutingProxy();
http.createServer(function (req, res) {
 
 console.log('//////////////////////////////////////////////////////////////')
 
 proxy.proxyRequest(req, res, {
   host: 'localhost',
   port: 3000
//   host: 'onside.mini-apps.co.uk',
//   port: 80
 });
}).listen(8000);
console.log("Proxy server listening on port 8000");
console.log(proxy)

