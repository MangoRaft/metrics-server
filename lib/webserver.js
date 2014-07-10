var fs = require('fs');
var express = require('express');
var compression = require('compression');
var responseTime = require('response-time');
var uuid = require('node-uuid');
var WebSocketServer = require('ws').Server;
var async = require('async');

var mongoose = require('../mongoose');

module.exports.createServer = function(options) {
	return new Server(options);
};

function Watcher(ws) {
	this.ws = ws;
	this.id = uuid.v4();
	this.groups = {};
	this.timmer = 0;
}

Watcher.prototype.add = function(group, schema) {
	console.log('add', group, schema)
	if (!this.groups[group]) {
		this.groups[group] = [];
	}
	this.groups[group].push(schema);

	if (this.timmer == 0) {
		this.timmer = setInterval(this.poller.bind(this), 1000);
	}
};

Watcher.prototype.remove = function(group, schema) {
	if (this.groups[group]) {
		this.groups[group].splice(this.groups[group].indexOf(schema), 1);
		if (this.groups[group].length == 0) {
			delete this.groups[group];
		}
	}
};

Watcher.prototype.poller = function() {

	var self = this;

	Object.keys(this.groups).forEach(function(group) {

		var tasks = [];

		self.groups[group].forEach(function(schema) {
			tasks.push(function(next) {
				mongoose.TimeSeries(schema).latest({}, next);
			});
		});
		async.parallel(tasks, function(err, results) {
			if (err)
				return;
			self.ws.send(JSON.stringify({
				group : group,
				results : results
			}), function() {
				//
			});
		});
	});
};

Watcher.prototype.close = function() {
	clearInterval(this.timmer);
	this.groups = {};
};

function Server(options) {
	this.options = options;
	this.watch = {};
};

Server.prototype.ws = function() {

	var watch = this.watch;

	this.wss = new WebSocketServer({
		server : this.server
	});

	this.wss.on('connection', function(ws) {

		var watcher = new Watcher(ws);

		watch[watcher.id] = watcher;

		ws.on('message', function(data, flags) {
			try {
				var json = JSON.parse(data);
			} catch(e) {
				return console.log(e);
			}
			if (!json.event || !json.group || !json.schema) {
				return console.log('need json.event || json.group || json.schema')
			}

			switch (json.event) {
				case 'start':
					watcher.add(json.group, json.schema);
					break;
				case 'stop':
					watcher.remove(json.group, json.schema);
					break;
				default:
			}
		});

		ws.on('close', function(code, message) {
			watcher.close();
			delete watch[watcher.id];
		});
	});

};

Server.prototype.registerServer = function() {
	var self = this;

	var app = this.app = express();
	app.use(compression());
	app.use(responseTime(5));

	// respond
	var server = this.server = require('http').createServer(app);

	app.all('*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Allow-Methods', 'GET');
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		next();
	});

	app.get("/metric/:token", this.getMetric.bind(this));
	app.get("/min/:token", this.min.bind(this));
	app.get("/max/:token", this.max.bind(this));
	app.get("/latest/:token", this.latest.bind(this));
	app.get("/find/:token", this.find.bind(this));

	this.ws();

	server.listen(this.options.port, this.options.host);
};

Server.prototype.latest = function(req, res) {
	var token = req.params.token;

	mongoose.TimeSeries(token).latest({}, function(error, data) {
		res.send(data);
	});
};

Server.prototype.find = function(req, res) {
	var token = req.params.token;

	mongoose.TimeSeries(token).model.find(req.query || {}, function(error, data) {
		res.setHeader('x-count', data.length);
		res.send(data);
	});
};

Server.prototype.getMetric = function(req, res) {
	var token = req.params.token;

	var from = req.query.from;
	var to = req.query.to;
	var interval = req.query.interval || 'seconds';
	var type = req.query.type || 'sum';

	if (!from) {
		from = new Date(new Date() - 1000 * 60 * 60 * 24);
	} else {

		if (!isNaN(from)) {
			from = Number(from);
		}

		from = Date.past(from);
	}

	if (to) {
		if (!isNaN(to)) {
			to = Number(to);
		}
		to = new Date(to);
	}
	var model = mongoose.TimeSeries(token);
	if (model[interval]) {
		mongoose.TimeSeries(token)[interval]({
			from : from,
			to : to,
			type : type
		}, function(error, data) {
			res.setHeader('x-count', data.length);
			res.send(data);
		});
	} else {
		res.send(new Error('bad interval: days,hours,minutes,seconds'));
	}

};

Server.prototype.min = function(req, res) {
	var token = req.params.token;

	var from = req.query.from;
	var to = req.query.to;

	if (!from) {
		from = new Date(new Date() - 1000 * 60 * 60 * 24);
	} else {

		if (!isNaN(from)) {
			from = Number(from);
		}

		from = Date.past(from);
	}

	if (to) {
		if (!isNaN(to)) {
			to = Number(to);
		}
		to = new Date(to);
	} else {
		to = new Date();
	}

	var model = mongoose.TimeSeries(token);

	mongoose.TimeSeries(token).min({
		from : from,
		to : to
	}, function(error, min) {
		if (error)
			throw error;
		res.send({
			min : min
		});
	});

};

Server.prototype.max = function(req, res) {
	var token = req.params.token;

	var from = req.query.from;
	var to = req.query.to;

	if (!from) {
		from = new Date(new Date() - 1000 * 60 * 60 * 24);
	} else {

		if (!isNaN(from)) {
			from = Number(from);
		}

		from = Date.past(from);
	}

	if (to) {
		if (!isNaN(to)) {
			to = Number(to);
		}
		to = new Date(to);
	} else {
		to = new Date();
	}

	var model = mongoose.TimeSeries(token);

	mongoose.TimeSeries(token).max({
		from : from,
		to : to
	}, function(error, max) {
		if (error)
			throw error;
		res.send({
			max : max
		});
	});

};

Server.prototype.start = function() {
	mongoose.start(this.options.mongodb || {});
	this.registerServer();
};

Server.prototype.stop = function() {

	var watch = this.watch;
	Object.keys(watch).forEach(function(id) {
		watch[id].close();
		delete watch[id];
	});
	this.server.close();
};

