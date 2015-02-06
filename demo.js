var usage = require('usage');

var memory = require('./lib/metric').createMetric({
	host : '127.0.0.1',
	port : 4001
});

var cpu = require('./lib/metric').createMetric({
	host : '127.0.0.1',
	port : 4001
});

memory.interval = cpu.interval = false;

memory.token = 'demo.memory';
cpu.token = 'demo.cpu';

var pid = process.pid;

setInterval(function() {
	usage.lookup(pid, {
		keepHistory : true
	}, function(err, result) {
		memory.cb(result.memory);
		cpu.cb(result.cpu);
	});
}, 1000);

memory.start();
cpu.start();
