var util = require('util');
var events = require('events');
var dgram = require('dgram');

var punt = require('punt');
var mongoose = require('../mongoose');
var Server = require('./server').Server;

module.exports.createServer = function(options) {
	return new UDPServer(options);
};

function UDPServer(options) {
	Server.call(this, options);
};
//
// Inherit from `events.EventEmitter`.
//
util.inherits(UDPServer, Server);

UDPServer.prototype._onMessage = function(msg) {
	var data = msg.toString().split(' ');

	if (data.length < 3) {
		return;
	}

	this.onMessage({
		token : data[0],
		metric : data[1],
		time : data[2],
		type : data[3] || 'push'
	});
};

UDPServer.prototype.start = function() {
	mongoose.start(this.options.mongodb || {});
	this.server = dgram.createSocket('udp4');
	this.server.bind(this.options.port, this.options.host);
	this.server.on('message', this._onMessage.bind(this));
};

UDPServer.prototype.stop = function() {
	this.server.close();
};
