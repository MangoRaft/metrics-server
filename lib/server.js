var util = require('util');
var events = require('events');

var mongoose = require('../mongoose');

var Server = module.exports.Server = function(options) {
	events.EventEmitter.call(this);
	this.options = options;

};
//
// Inherit from `events.EventEmitter`.
//
util.inherits(Server, events.EventEmitter);

Server.prototype.onAdd = function(msg) {
	console.log(msg.token, msg.metric)
	var time = msg.time ? new Date(Number(msg.time)) : new Date();
	var metric = msg.metric;
	var token = msg.token;
	var type = msg.type;

	if (!token) {
		return console.error('no token');
	}

	if (isNaN(metric)) {
		return console.error('metric isNaN');
	} else {
		metric = Number(metric);
	}

	mongoose.TimeSeries(token)[type](time, metric);

};

Server.prototype.onMessage = function(msg) {
	if (Array.isArray(msg))
		msg.forEach(this.onAdd.bind(this));
	else
		this.onAdd(msg);
};

