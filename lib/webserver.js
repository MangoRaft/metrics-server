var fs = require('fs');
var express = require('express');
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
	app.get("/metric/:token/count", this.getMetricCount.bind(this));

	server.listen(this.options.port, this.options.host);
};

Server.prototype.query = function(req) {
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
	return query;

};

Server.prototype.getCount = function(req, res) {

	mongoose.Metric.count({}, function(err, count) {
		res.json({
			count : count
		});
	});

};

Server.prototype.getMetricCount = function(req, res) {

	var query = this.query(req);

	mongoose.Metric.count(query, function(err, count) {
		res.json({
			count : count
		});
	});

};

Server.prototype.getMetric = function(req, res) {

	var limit = req.query.limit || 1000;

	if (limit > 10000) {
		limit = 10000;
	}
	var query = this.query(req);

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

