/*
 *
 * (C) 2013, MangoRaft.
 *
 */

var fs = require('fs');
var path = require('path');
var util = require('util');
var events = require('events');
var url = require('url');
var os = require('os');
var http = require('http');
var cluster = require('cluster');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var httpProxy = require('http-proxy');
var raft = require('raft');
var log = require('raft-logger');
var ejs = require('ejs');
/**
 *
 */
ejs.open = '{{';
ejs.close = '}}';

/***
 *
 */

// Timers for sweepers

const RPS_SWEEPER = 1000;
// Requests rate sweeper
const START_SWEEPER = 30000;
// Timer to publish router.start for refreshing state
const CHECK_SWEEPER = 30000;
// Check time for watching health of registered droplet
const MAX_AGE_STALE = 120000;
// Max stale age, unregistered if older then 2 minutes
const CPU_COUNT = os.cpus().length;
// Max stale age, unregistered if older then 2 minutes
/**
 *
 *
 */

var Router = module.exports = function(instance, options) {
	EventEmitter2.call(this, {
		wildcard : true, // should the event emitter use wildcards.
		delimiter : '::', // the delimiter used to segment namespaces, defaults to `.`.
		newListener : false, // if you want to emit the newListener event set to true.
		maxListeners : 200, // the max number of listeners that can be assigned to an event, defaults to 10.
	});

	this.uid = raft.common.uuid(true);
	this.varz = {
		requests_per_sec : 0,
		requests : 0,
		up_per_sec : 0,
		down_per_sec : 0,
		up : 0,
		down : 0
	};
	this.droplets = {};

	this.current_num_requests = 0;
	this.current_num_up = 0;
	this.current_num_down = 0;
	this.logs = {
		logger : log.Logger.createLogger(raft.config.get('logs:udp'))
	};

	this.log = this.logs.logger.create('raft', 'router', raft.config.get('log_session'));

	this.log.log('Router startting... ');
	this.log.log('Process type is ' + (cluster.isMaster ? 'Master' : 'Worker'));
};
//
// Inherit from `events.EventEmitter`.
//
util.inherits(Router, EventEmitter2);

Router.prototype.stop = function() {
	this.server.close();
};

Router.prototype.start = function() {
	var self = this;
	this.server = httpProxy.createServer(this.proxy_request.bind(this));

	if (cluster.isMaster) {
		cluster.setupMaster({
			silent : false,
			args : [process.argv[2]]
		});

		for (var i = 0, j = CPU_COUNT.length; i < j; i++) {
			this.fork();
		};

	} else {

		this.setup_listeners();
		this.setup_sweepers();
		this.loadStatic();
		this.server.listen(raft.config.get('router:http:port'));
		this.server.proxy.on('end', function(req, res) {
			res.timer.end = Date.now();

			if (!req.droplet)
				return;

			req.droplet.usage.requests = req.droplet.usage.requests + 1;
			req.droplet.usage.upload = req.droplet.usage.upload + req.socket.bytesRead;
			req.droplet.usage.download = req.droplet.usage.download + req.socket.bytesWritten;
			droplet.log.log(self.gen_log_info(req, res, droplet));
		});

	};

};

Router.prototype.loadStatic = function() {
	var self = this;
	fs.readFile(__dirname + '/../../static/code.html', function(err, data) {
		if (err)
			throw err;
		self.compiled = ejs.compile(data.toString(), {});
	});
};

Router.prototype.fork = function() {
	var self = this;
	if (cluster.isMaster) {
		var worker = cluster.fork();
		worker.once('listening', function() {
			worker.once('exit', function(code, signal) {
				if (code !== 0) {
					self.fork();
				}
			});
		});
		worker.once('listening', function() {
			raft.nats.publish('router.start', {});
		});
	} else {
		this.emit('error', new Error('can not fork from worker'));
	}
};
Router.prototype.killOne = function(callback) {
	var self = this;
	var id = Object.keys(cluster.workers)[0];

	if (!id) {
		return callback();
	}

	cluster.workers[id].disconnect();
	cluster.workers[id].once('disconnect', callback);
};

Router.prototype.setup_listeners = function() {
	var self = this;
	raft.nats.subscribe('router.register', function(msg) {
		var uris;
		if (!( uris = msg['uris'])) {
			return;
		}
		uris.forEach(function(uri) {
			self.register_droplet(uri, msg['host'], msg['port'], msg['log_session'], msg['name'], msg['ps'], msg['app']);
		});
	});
	raft.nats.subscribe('router.unregister', function(msg) {
		var uris;
		if (!( uris = msg['uris'])) {
			return;
		}
		uris.forEach(function(uri) {
			self.unregister_droplet(uri, msg['host'], msg['port']);
		});
	});
};

Router.prototype.setup_sweepers = function() {
	this.rps_timestamp = Date.now();

	setInterval(this.calc_rps.bind(this), RPS_SWEEPER);
	//setInterval(this.check_registered_urls.bind(this), CHECK_SWEEPER)

};

Router.prototype.calc_rps = function(keys, app) {
	var self = this;
	var now = Date.now();
	var delta = this.varz['delta'] = (now - this.rps_timestamp);
	this.rps_timestamp = this.varz['timestamp'] = now;

	var new_num_requests = this.varz['requests'];
	var new_num_up = this.varz['up'];
	var new_num_down = this.varz['down'];
	this.varz['requests_per_sec'] = ((new_num_requests - this.current_num_requests) / delta) * 1000;
	this.varz['up_per_sec'] = ((new_num_up - this.current_num_up) / delta);
	this.varz['down_per_sec'] = ((new_num_down - this.current_num_down) / delta);
	this.current_num_requests = new_num_requests;
	this.current_num_up = new_num_up;
	this.current_num_down = new_num_down;

	// Go ahead and calculate rates for all backends here.
	var apps = [];
	var total_requests = 0;
	var total_up = 0;
	var total_down = 0;
	Object.keys(this.droplets).forEach(function(url) {
		var droplets = self.droplets[url];
		droplets.forEach(function(droplet) {
			total_requests += droplet.usage.requests;
			total_up += droplet.usage.upload;
			total_down += droplet.usage.download;
			droplet.usage.requests = 0;
			droplet.usage.upload = 0;
			droplet.usage.download = 0;
		});
	});
	this.varz['requests'] = this.varz['requests'] + total_requests;
	this.varz['up'] = this.varz['up'] + total_up;
	this.varz['down'] = this.varz['down'] + total_down;

	raft.nats.publish('router.usage', this.varz);
};

Router.prototype.register_droplet = function(url, host, port, log_session, name, ps, app_id) {
	if (!(host && port)) {
		return;
	}

	var droplets = this.droplets[url] || [];
	for (var i = 0; i < droplets.length; i++) {
		var droplet = droplets[i];
		if (droplet['host'] == host && droplet['port'] == port) {
			droplet['timestamp'] = Date.now();
			return;
		}
	};
	var droplet = {
		app : app_id,
		log_session : log_session,
		log : this.logs.logger.create(name, 'router', log_session),
		host : host,
		port : port,
		clients : [],
		url : url,
		timestamp : Date.now(),
		name : name,
		ps : ps,
		usage : {
			requests : 0,
			upload : 0,
			download : 0
		}
	};
	droplets.push(droplet);
	this.droplets[url] = droplets;
	this.log.log("Registering " + url + " at " + host + ":" + port + "");
	this.log.log("" + droplets.length + " servers available for " + url + "");
};

Router.prototype.unregister_droplet = function(url, host, port) {
	this.log.log("Unregistering " + url + " for host " + host + ":" + port);
	var droplets = this.droplets[url] || [];
	for (var i = 0; i < droplets.length; i++) {
		var d = droplets[i];
		if (d['host'] == host && d['port'] == port)
			droplets.splice(i, 1);
	};
	if (!droplets.length && this.droplets[url]) {
		delete this.droplets[url];
	} else {
		this.droplets[url] = droplets;
	}
	this.log.log(droplets.length + " servers available for " + url);
};

Router.prototype.check_registered_urls = function(keys, app) {
	var self = this;
	var start = Date.now();
	var to_drop = [];
	Object.keys(this.droplets).forEach(function(uri) {
		var droplets = self.droplets[uri];
		droplets.forEach(function(droplet) {
			if ((start - droplet['timestamp']) > MAX_AGE_STALE) {
				to_drop.push(droplet);
			}
		});
	});
	to_drop.forEach(function(droplet) {
		self.unregister_droplet(droplet['url'], droplet['host'], droplet['port']);
	});
};

Router.prototype.proxy_request = function(req, res, proxy) {
	var self = this;

	res.timer = {
		start : Date.now()
	};

	if (!req.headers.host) {
		return this.serveText(req, res, proxy, {
			code : 400,
			message : 'No HOST header included'
		});
	}

	var host = req.headers.host.split(':')[0];
	var droplets = this.droplets[host];

	var droplet;

	if (!droplets) {
		return this.serveText(req, res, proxy, {
			code : 404,
			message : 'Package not found'
		});
	}
	if (!droplets.length) {
		return this.serveText(req, res, proxy, {
			code : 503,
			message : 'Package offline'
		});
	}

	droplet = droplets.shift();
	droplets.push(droplet);

	req.droplet = droplet;

	var buffer = httpProxy.buffer(req);

	this.set_headers(req, droplet);

	res.timer.startBackend = Date.now();

	proxy.proxyRequest(req, res, {
		host : droplet.host,
		port : droplet.port,
		buffer : buffer
	});
};

Router.prototype.serveText = function(req, res, proxy, msg) {
	var self = this;
	var text = msg.message;
	var diff = Date.now() - req.ptime;
	if (msg.meta) {
		text = [message, qs.unescape(qs.stringify(msg.meta, ', '))].join(' | ');
	}
	text = this.compiled({
		text : text,
		code : msg.code
	}, {});
	res.statusCode = msg.code;

	res.setHeader('content-type', 'text/html');
	res.setHeader('x-powered-by', 'raft');

	if (req.method !== 'HEAD') {
		res.write(text);
	}
	res.on('end', function() {
		self.log.log(msg.message + ' ' + self.gen_log_info(req, res, droplet));
	});
	res.end();
};
//at=info method=GET path=/ host=myapp.herokuapp.com fwd="204.204.204.204" dyno=web.1 connect=1ms service=18ms status=200 bytes=13

Router.prototype.gen_log_info = function(req, res, droplet) {
	var host = req.headers.host.split(':')[0];
	return 'method=' + req.method + ' path=' + req.url + ' host=' + host + ' fwd=' + this.getRemoteAddress(req) + ' droplet=' + ( droplet ? droplet.ps : 'null');
};

Router.prototype.set_headers = function(req, droplet) {

};
Router.prototype.getRemoteAddress = function(req) {
	if (req.connection === undefined) {
		return null;
	}
	if (req.connection.remoteAddress) {
		return req.connection.remoteAddress;
	}
	if (req.connection.socket && req.connection.socket.remoteAddress) {
		return req.connection.socket.remoteAddress;
	}
	return null;
};
Router.prototype.validate = function(keys, app) {

};
