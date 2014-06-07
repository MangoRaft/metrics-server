var mongodb = {
	username : '',
	password : '',
	host : '',
	port : 0,
	path : '/'
};

var udpServer = require('metrics-server').udpserver.createServer({
	host : '127.0.0.1',
	port : 4001,
	mongodb : mongodb
});

var webServer = require('metrics-server').webserver.createServer({
	udp : udpServer,
	host : '127.0.0.1',
	port : 4002,
	mongodb : mongodb
});

webServer.start();
udpServer.start();
