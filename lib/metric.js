var dgram = require('dgram');

module.exports.createMetric = function(options) {
	return new Metric(options);
};

var Metric = function(options) {
	this.options = options;
};

Metric.prototype = {
	interval : 1000, // ms
	token : null,
	type : 'push',
	start : function() {
		var self = this;
		if (this.interval)
			this.job = setInterval(this.run.bind(this, this.cb.bind(this)), this.interval);
		this.udp = dgram.createSocket('udp4');
	},
	stop : function() {
		if (this.interval)
			clearInterval(this.job);
	},
	cb : function(metric, time) {
		var data = [this.token, metric, time || Date.now(), this.type];
		var buf = new Buffer(data.join(' '));
		this.udp.send(buf, 0, buf.length, this.options.port, this.options.host);
	}
};

