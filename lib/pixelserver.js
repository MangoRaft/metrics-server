var util = require('util');
var events = require('events');
var http = require('http');
var url = require('url');

var pixel = require('./pixel');
var mongoose = require('../mongoose');
var Server = require('./server').Server;

module.exports.createServer = function(options) {
	return new PixelServer(options);
};

function PixelServer(options) {
	Server.call(this, options);
};
//
// Inherit from `events.EventEmitter`.
//
util.inherits(PixelServer, Server);

PixelServer.prototype.pixelHandler = function(req, res) {
	res.writeHead(200, pixel.headers);
	res.end(pixel.data);

	var msg = url.parse(req.url, true).query;

	this.onMessage({
		token : msg.token,
		metric : msg.metric || 1,
		time : msg.time,
		type : 'inc'
	});
};

PixelServer.prototype._onMessage = function(req, res) {
	if (req.url.match(/^\/tracking_pixel/)) {
		this.pixelHandler(req, res);
	} else {
		res.end();
	}

};

PixelServer.prototype.start = function() {
	mongoose.start(this.options.mongodb || {});
	this.server = http.createServer().listen(this.options.port, this.options.host);
	this.server.on('request', this._onMessage.bind(this));
};

PixelServer.prototype.stop = function() {
	this.server.close();
};
