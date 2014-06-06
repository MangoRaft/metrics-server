var usage = require('usage');

var udpServer = require('./lib/udpserver').createServer({
	host : '127.0.0.1',
	port : 4001,
	mongodb : {
		host : '127.0.0.1'
	}
});

var webServer = require('./lib/webserver').createServer({
	udp : udpServer,
	host : '127.0.0.1',
	port : 4002,
	mongodb : {
		host : '127.0.0.1'
	}
});


webServer.start();
udpServer.start();
