var child_process = require('child_process');
var mongodb = {
	host : 'localhost',
	port : 27017,
	path : '/data/db'
};

function fork(type) {
	child_process.fork(__filename, [type]).once('exit', function() {
		fork(type)
	});
}

if (process.argv[2] == 'udp') {
	require('./').udpserver.createServer({
		host : '127.0.0.1',
		port : 4001,
		mongodb : mongodb
	}).start();
} else if (process.argv[2] == 'web') {
	require('./').webserver.createServer({
		host : '127.0.0.1',
		port : 4001,
		mongodb : mongodb
	}).start();
} else if (process.argv[2] == 'ws') {
	require('./').wsserver.createServer({
		host : '127.0.0.1',
		port : 4002,
		mongodb : mongodb
	}).start();
} else if (process.argv[2] == 'pixel') {
	require('./').pixelserver.createServer({
		host : '127.0.0.1',
		port : 4003,
		mongodb : mongodb
	}).start();
} else {
	fork('udp');
	fork('web');
	fork('ws');
	fork('pixel');
}
