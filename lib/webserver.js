var fs = require('fs');
var express = require('express');
var socketio = require('socket.io');
var raft = require('raft');
var mongoose = require('../mongoose');

module.exports.createServer = function(options) {
	return new Server(options);
};

function Server(options) {
	this.options = options;
};

Server.prototype.registerServer = function() {
	var app = this.app = express();
	var self = this;
	// respond
	var server = require('http').createServer(app);

	
	app.get("/count", this.getCount.bind(this));
	app.get("/metric/:token", this.getMetric.bind(this));
	app.get("/stream/raw/:token", this.streamRawMetric.bind(this));
	app.get("/map/avrage/:token", this.mapAvrage.bind(this));
	app.get("/map/count/:token", this.mapCount.bind(this));
	app.get("/metric/:token/count", this.getMetricCount.bind(this));
	
	server.listen(this.options.port, this.options.host);
};


Server.prototype.mapAvrage = function(req, res) {

	var token = req.params.token;

	var from = req.query.from;
	var to = req.query.to;
	var name = req.query.name;
	var group = req.query.group;

	var query = {
		token : token
	};

	if (name) {
		query.name = name;
	}
	if (group) {
		query.group = group;
	}

	if (from) {
		query.time = {
			"$gte" : new Date(from)
		};
		if (to) {
			query.time['$lt'] = new Date(to);
		}
	}
	var result = {
		sum : 0,
		count : 0,
		avg : 0,
		high : 0,
		low : 500
	};
	var stream = mongoose.Metric.find(query).sort({
		'time' : -1
	}).stream();

	stream.on('data', function(doc) {
		if (doc.metric > result.high) {
			result.high = doc.metric;
		}
		if (doc.metric > 0) {
			if (doc.metric < result.low) {
				result.low = doc.metric;
			}
		}
		result.sum += doc.metric;
		result.count += 1;
	});

	stream.on('close', function() {
		result.avg = result.sum / result.count;
		res.send(result);
	});
};

Server.prototype.mapCount = function(req, res) {

	var token = req.params.token;

	var from = req.query.from;
	var to = req.query.to;
	var name = req.query.name;
	var group = req.query.group;

	var query = {
		token : token
	};

	if (name) {
		query.name = name;
	}
	if (group) {
		query.group = group;
	}

	if (from) {
		query.time = query.time || {};
		query.time['$gte'] = new Date(from);

	}
	if (to) {
		query.time = query.time || {};
		query.time['$lt'] = new Date(to);
	}
	var result = {
		sum : 0,
		count : 0,
		high : 0,
		low : 0
	};
	var stream = mongoose.Metric.find(query).sort({
		'time' : -1
	}).stream();

	stream.on('data', function(doc) {
		if (doc.metric > result.high) {
			result.high = doc.metric
		}
		if (doc.metric < result.low) {
			result.low = doc.metric;
		}
		result.sum += doc.metric;
		result.count += 1;
	});

	stream.on('close', function() {
		res.send(result);
	});
};

Server.prototype.getCount = function(req, res) {

	mongoose.Metric.count({}, function(err, count) {
		res.json({
			count : count
		});
	});

};

Server.prototype.getMetricCount = function(req, res) {
	var token = req.params.token;

	var from = req.query.from;
	var to = req.query.to;
	var name = req.query.name;
	var group = req.query.group;

	var query = {
		token : token
	};

	if (name) {
		query.name = name;
	}
	if (group) {
		query.group = group;
	}

	if (from) {
		query.time = {
			"$gte" : new Date(from)
		};
		if (to) {
			query.time['$lt'] = new Date(to);
		}
	}

	mongoose.Metric.count(query, function(err, count) {
		res.json({
			count : count
		});
	});

};

Server.prototype.streamRawMetric = function(req, res) {

	var token = req.params.token;

	var from = req.query.from;
	var to = req.query.to;

	var name = req.query.name;
	var group = req.query.group;

	var limit = req.query.limit || 1000;

	var query = {
		token : token
	};

	query.name = name;

	query.group = group;

	if (from) {
		query.time = query.time || {};
		query.time['$gte'] = new Date(from);

	}
	if (to) {
		query.time = query.time || {};
		query.time['$lt'] = new Date(to);
	}
	var stream = mongoose.Metric.find(query).sort({
		'time' : -1
	}).stream({
		transform : function(data) {
			return JSON.stringify(data) + '\n';
		}
	});
	stream.pipe(res);
};

Server.prototype.getMetric = function(req, res) {

	var token = req.params.token;

	var from = req.query.from;
	var to = req.query.to;
	var name = req.query.name;
	var group = req.query.group;

	var limit = req.query.limit || 1000;

	if (limit > 10000) {
		limit = 10000;
	}

	var query = {
		token : token
	};

	if (name) {
		query.name = name;
	}

	if (group) {
		query.group = group;
	}

	if (from) {
		query.time = query.time || {};
		query.time['$gte'] = new Date(from);

	}
	if (to) {
		query.time = query.time || {};
		query.time['$lt'] = new Date(to);
	}
	mongoose.Metric.find(query).sort({
		'time' : -1
	}).limit(limit).exec(function(err, metrics) {
		if (err) {
			return res.send(err);
		}

		var _metrics = {};

		metrics.forEach(function(metric) {

			_metrics[metric.group] = _metrics[metric.group] || {};
			_metrics[metric.group][metric.name] = _metrics[metric.group][metric.name] || [];

			_metrics[metric.group][metric.name].push({
				time : metric.time,
				metric : metric.metric
			});
		});

		res.json(_metrics);
	});

};
Server.prototype.start = function() {
	mongoose.start(this.options.mongodb || {});
	this.registerServer();
};

Server.prototype.stop = function() {

};

