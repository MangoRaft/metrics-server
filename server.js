var fork = require('child_process').fork;
var mongodb = {
	host : 'localhost',
	port : 27017,
	path : '/data/db'
};


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
	fork(__filename, ['udp']);
	fork(__filename, ['web']);
	fork(__filename, ['ws']);
	fork(__filename, ['pixel']);
}
