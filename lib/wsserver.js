var util = require('util');
var events = require('events');
var WebSocketServer = require('ws').Server;
var mongoose = require('../mongoose');
var Server = require('./server').Server;

module.exports.createServer = function(options) {
	return new WsServer(options);
};

function WsServer(options) {
	Server.call(this, options);
};
//
// Inherit from `events.EventEmitter`.
//
util.inherits(WsServer, Server);

WsServer.prototype.onConnection = function(ws) {
	ws.on('message', this._onMessage.bind(this));
};

WsServer.prototype._onMessage = function(msg) {
	var data = msg.toString().split(' ');

	if (data.length < 3) {
		return;
	}
	//console.log(data)
	this.onMessage({
		token : data[0],
		metric : data[1],
		time : data[2],
		type : data[3] || 'push'
	});
};

WsServer.prototype.start = function() {
	mongoose.start(this.options.mongodb || {});
	this.server = new WebSocketServer({
		port : this.options.port,
		host : this.options.host,
		path : this.options.path || '/metrics'
	});
	this.server.on('connection', this.onConnection.bind(this));
};

WsServer.prototype.stop = function() {
	this.server.close();
};
