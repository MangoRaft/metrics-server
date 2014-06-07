var util = require('util');
var events = require('events');

var punt = require('punt');
var mongoose = require('../mongoose');

module.exports.createServer = function(options) {
	return new UDPServer(options);
};

function UDPServer(options) {
	events.EventEmitter.call(this);
	this.options = options;
};
//
// Inherit from `events.EventEmitter`.
//
util.inherits(UDPServer, events.EventEmitter);

UDPServer.prototype.onMessage = function(msg) {

	var time = msg.time;
	var metric = msg.metric;
	var token = msg.token;
	var name = msg.name;
	var group = msg.group;

	if (!token) {
		return;
	}

	var item = {
		time : time,
		metric : metric,
		token : token,
		name : name
	};

	if (group) {
		item.group = group;
	}

	(new mongoose.Metric(item)).save(function(err) {
		if (err)
			console.log(err);
	});
	this.emit('metric', item);
};

UDPServer.prototype.start = function() {
	mongoose.start(this.options.mongodb || {});
	this.server = punt.bind(this.options.host + ':' + this.options.port);
	this.server.on('message', this.onMessage.bind(this));
};

UDPServer.prototype.stop = function() {
	this.server.sock.close();
};
