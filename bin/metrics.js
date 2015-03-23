#!/usr/bin/env node
var program = require('commander');
var cluster = require('cluster');

program.version(require('../package.json').version);

var udp = program.command('udp');
udp.description('View logs in teal-time.');

udp.option('-a, --addr [HOST]', 'Bind to HOST address (default: 127.0.0.1)', '127.0.0.1');
udp.option('-p, --port [PORT]', 'Use PORT (default: 4001)', 4001);
udp.option('-A, --mongo-addr [HOST]', 'Connect to mongodb HOST address (default: 127.0.0.1)', '127.0.0.1');
udp.option('-P, --mongo-port [PORT]', 'Connect to mongodb PORT (default: 27017)', 27017);
udp.option('-B, --mongo-path [PATH]', 'Connect to mongodb PATH (default: /data/db)', '/data/db');
udp.option('-C, --mongo-user [USER]', 'Connect to mongodb USER ');
udp.option('-D, --mongo-pass [PASS]', 'Connect to mongodb PASS');
udp.option('-c, --cluster', 'Start server as cluster', false);

function udpServer(config) {
	require('../').udpserver.createServer(config).start();
}

udp.action(function(options) {
	var mongodb = {
		host : options.mongoHost,
		port : options.mongoPort,
		path : options.mongoPath
	};

	if (options.mongoUser) {
		mongodb.username = options.mongoUser;
	}
	if (options.mongoPass) {
		mongodb.password = options.mongoPass;
	}

	if (options.cluster) {
		var numCPUs = require('os').cpus().length;
		if (cluster.isMaster) {
			for (var i = 0; i < numCPUs; i++)
				cluster.fork();

		} else {
			udpServer({
				host : options.addr,
				port : options.port,
				mongodb : mongodb
			});
		}
	} else {
		udpServer({
			host : options.addr,
			port : options.port,
			mongodb : mongodb
		});
	}

});

var web = program.command('web');
web.description('View logs in teal-time.');

web.option('-a, --addr [HOST]', 'Bind to HOST address (default: 127.0.0.1)', '127.0.0.1');
web.option('-p, --port [PORT]', 'Use PORT (default: 4001)', 4001);
web.option('-A, --mongo-addr [HOST]', 'Connect to mongodb HOST address (default: 127.0.0.1)', '127.0.0.1');
web.option('-P, --mongo-port [PORT]', 'Connect to mongodb PORT (default: 27017)', 27017);
web.option('-B, --mongo-path [PATH]', 'Connect to mongodb PATH (default: /data/db)', '/data/db');
web.option('-C, --mongo-user [USER]', 'Connect to mongodb USER ');
web.option('-D, --mongo-pass [PASS]', 'Connect to mongodb PASS');
web.option('-c, --cluster', 'Start server as cluster', false);

function webServer(config) {
	require('../').webserver.createServer(config).start();
}

web.action(function(options) {
	var mongodb = {
		host : options.mongoHost,
		port : options.mongoPort,
		path : options.mongoPath
	};

	if (options.mongoUser) {
		mongodb.username = options.mongoUser;
	}
	if (options.mongoPass) {
		mongodb.password = options.mongoPass;
	}

	if (options.cluster) {
		var numCPUs = require('os').cpus().length;
		if (cluster.isMaster) {
			for (var i = 0; i < numCPUs; i++)
				cluster.fork();

		} else {
			webServer({
				host : options.addr,
				port : options.port,
				mongodb : mongodb
			});
		}
	} else {
		webServer({
			host : options.addr,
			port : options.port,
			mongodb : mongodb
		});
	}
});

var ws = program.command('ws');
ws.description('View logs in teal-time.');

ws.option('-a, --addr [HOST]', 'Bind to HOST address (default: 127.0.0.1)', '127.0.0.1');
ws.option('-p, --port [PORT]', 'Use PORT (default: 4002)', 4002);
ws.option('-A, --mongo-addr [HOST]', 'Connect to mongodb HOST address (default: 127.0.0.1)', '127.0.0.1');
ws.option('-P, --mongo-port [PORT]', 'Connect to mongodb PORT (default: 27017)', 27017);
ws.option('-B, --mongo-path [PATH]', 'Connect to mongodb PATH (default: /data/db)', '/data/db');
ws.option('-C, --mongo-user [USER]', 'Connect to mongodb USER ');
ws.option('-D, --mongo-pass [PASS]', 'Connect to mongodb PASS');
ws.option('-c, --cluster', 'Start server as cluster', false);

function wsServer(config) {
	require('../').wsserver.createServer(config).start();
}

ws.action(function(options) {
	var mongodb = {
		host : options.mongoHost,
		port : options.mongoPort,
		path : options.mongoPath
	};

	if (options.mongoUser) {
		mongodb.username = options.mongoUser;
	}
	if (options.mongoPass) {
		mongodb.password = options.mongoPass;
	}

	if (options.cluster) {
		var numCPUs = require('os').cpus().length;
		if (cluster.isMaster) {
			for (var i = 0; i < numCPUs; i++)
				cluster.fork();

		} else {
			wsServer({
				host : options.addr,
				port : options.port,
				mongodb : mongodb
			});
		}
	} else {
		wsServer({
			host : options.addr,
			port : options.port,
			mongodb : mongodb
		});
	}
});

var pixel = program.command('pixel');
pixel.description('View logs in teal-time.');

pixel.option('-a, --addr [HOST]', 'Bind to HOST address (default: 127.0.0.1)', '127.0.0.1');
pixel.option('-p, --port [PORT]', 'Use PORT (default: 4003)', 4003);
pixel.option('-A, --mongo-addr [HOST]', 'Connect to mongodb HOST address (default: 127.0.0.1)', '127.0.0.1');
pixel.option('-P, --mongo-port [PORT]', 'Connect to mongodb PORT (default: 27017)', 27017);
pixel.option('-B, --mongo-path [PATH]', 'Connect to mongodb PATH (default: /data/db)', '/data/db');
pixel.option('-C, --mongo-user [USER]', 'Connect to mongodb USER ');
pixel.option('-D, --mongo-pass [PASS]', 'Connect to mongodb PASS');
pixel.option('-c, --cluster', 'Start server as cluster', false);

function pixelServer(config) {
	require('../').pixelserver.createServer(config).start();
}

pixel.action(function(options) {
	var mongodb = {
		host : options.mongoHost,
		port : options.mongoPort,
		path : options.mongoPath
	};

	if (options.mongoUser) {
		mongodb.username = options.mongoUser;
	}
	if (options.mongoPass) {
		mongodb.password = options.mongoPass;
	}

	if (options.cluster) {
		var numCPUs = require('os').cpus().length;
		if (cluster.isMaster) {
			for (var i = 0; i < numCPUs; i++)
				cluster.fork();

		} else {
			pixelServer({
				host : options.addr,
				port : options.port,
				mongodb : mongodb
			});
		}
	} else {
		pixelServer({
			host : options.addr,
			port : options.port,
			mongodb : mongodb
		});
	}
});

var server = program.command('server');
server.description('View logs in teal-time.');

server.option('-a, --addr [HOST]', 'Bind to HOST address (default: 127.0.0.1)', '127.0.0.1');
server.option('-p, --port [PORT]', 'Use PORT (default: 4001)', 4001);
server.option('-x, --port-udp [PORT-UDP]', 'Use PORT (default: 4004)', 4004);
server.option('-x, --port-ws [PORT-WS]', 'Use PORT (default: 4002)', 4002);
server.option('-z, --port-pixel [PORT-PIXEL]', 'Use PORT (default: 4003)', 4003);
server.option('-A, --mongo-addr [HOST]', 'Connect to mongodb HOST address (default: 127.0.0.1)', '127.0.0.1');
server.option('-P, --mongo-port [PORT]', 'Connect to mongodb PORT (default: 27017)', 27017);
server.option('-B, --mongo-path [PATH]', 'Connect to mongodb PATH (default: /data/db)', '/data/db');
server.option('-C, --mongo-user [USER]', 'Connect to mongodb USER ');
server.option('-D, --mongo-pass [PASS]', 'Connect to mongodb PASS');
server.option('-w, --web', 'Start Web-Server', false);
server.option('-u, --udp', 'Start UDP-Server', false);
server.option('-W, --ws', 'Start Web-Server', false);
server.option('-U, --pixel', 'Start UDP-Server', false);

server.action(function(options) {
	var mongodb = {
		host : options.mongoHost,
		port : options.mongoPort,
		path : options.mongoPath
	};

	if (options.mongoUser) {
		mongodb.username = options.mongoUser;
	}
	if (options.mongoPass) {
		mongodb.password = options.mongoPass;
	}

	function build() {
		if (options.web) {
			webServer({
				host : options.addr,
				port : options.port,
				mongodb : mongodb
			});
		}
		if (options.udp) {
			udpServer({
				host : options.addr,
				port : options.portUdp,
				mongodb : mongodb
			});
		}
		if (options.ws) {
			wsServer({
				host : options.addr,
				port : options.portWs,
				mongodb : mongodb
			});
		}
		if (options.web) {
			pixelServer({
				host : options.addr,
				port : options.portPixel,
				mongodb : mongodb
			});
		}
	}

	if (options.cluster) {
		var numCPUs = require('os').cpus().length;
		if (cluster.isMaster) {
			for (var i = 0; i < numCPUs; i++)
				cluster.fork();

		} else {
			build()
		}
	} else {
		build()
	}
});

program.parse(process.argv);
if (!program.args.length) program.help();
