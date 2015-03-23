/*
 *
 * (C) 2013, MangoRaft.
 *
 */
require('sugar');
var mongoose = require('mongoose');
var schedule = require('node-schedule');
var Schema = mongoose.Schema;
var Mixed = mongoose.Schema.Types.Mixed;

var roundHour = function(d) {
	var t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
	return t;
};

function getInitializer() {
	var updates = {};

	updates.values = [];

	for (var k = 0; k < 60; k++) {
		updates.values[k] = [];
		for (var i = 0; i < 62; i++) {
			updates.values[k][i] = 0;
		};
	};

	return updates;
}

function getUpdates(timestamp, value, inc) {

	var updates = {};
	//statistics
	updates['updatedAt'] = new Date();

	updates['$inc'] = {
		'num_samples' : 1,
		'total_samples' : value
	};

	updates['$inc']['values.' + timestamp.getMinutes() + '.0'] = 1;
	updates['$inc']['values.' + timestamp.getMinutes() + '.1'] = value;

	updates['$min'] = {
		'min' : value
	};

	updates['$max'] = {
		'max' : value
	};

	if (inc) {
		updates['$inc']['values.' + timestamp.getMinutes() + '.' + (timestamp.getSeconds() + 2)] = value;
	} else {
		updates['values.' + timestamp.getMinutes() + '.' + (timestamp.getSeconds() + 2)] = value;
	}
	//console.log(updates)
	return updates;
}

/**
 * Schema definition
 */
var TimeSeries = new Schema({
	hour : {
		type : Date,
		index : true,
		required : true,
		unique : true
	},
	createdAt : {
		type : Date,
		'default' : Date
	},
	updatedAt : {
		type : Date,
		'default' : Date
	},
	num_samples : {
		type : Number,
		'default' : 0
	},
	total_samples : {
		type : Number,
		'default' : 0
	},
	min : {
		type : Number
	},
	max : {
		type : Number
	},
	values : []
});
TimeSeries.pre('save', function(next) {
	console.log(this.isNew);
	if (this.isNew) {

	}
	next();
});
TimeSeries.static('push', function(timestamp, value, metadata, cb) {

	var hour = roundHour(timestamp);

	var condition = {
		'hour' : hour
	};

	var updates = getUpdates(timestamp, value);

	var self = this;

	this.findOneAndUpdate(condition, updates, {
		select : '_id'
	}, function(error, doc) {

		if (error) {
			console.log(error);
			if (cb)
				cb(error);
		} else if (doc) {
			if (cb)
				cb(null, doc);
		} else {

			var datainit = getInitializer(null);

			var doc = new self({
				hour : hour
			});

			doc.set(datainit);
			doc.set(updates);
			doc.save(cb);

		}
	});
});
TimeSeries.static('inc', function(timestamp, value, metadata, cb) {

	var hour = roundHour(timestamp);

	var condition = {
		'hour' : hour
	};

	var updates = getUpdates(timestamp, value, true);

	var self = this;

	this.findOneAndUpdate(condition, updates, {
		select : '_id'
	}, function(error, doc) {
		if (error) {
			console.log(error);
			if (cb)
				cb(error);
		} else if (doc) {
			if (cb)
				cb(null, doc);
		} else {
			var datainit = getInitializer(null);
			var doc = new self({
				hour : hour
			});
			doc.set(datainit);
			doc.set(updates);
			doc.save(cb);

		}
	});
});

TimeSeries.static('getData', function(request, callback) {

	var condition = {
		'$and' : []
	};
	if (!request.to)
		request.to = new Date();
	else {

		request.to = new Date(request.to);
	}

	if (!request.dir)
		request.dir = 1;
	condition['$and'].push({
		'hour' : {
			'$gte' : roundHour(request.from),
		}
	});
	condition['$and'].push({
		'hour' : {
			'$lte' : request.to,
		}
	});
	this.find(condition).sort({
		'hour' : request.dir
	}).exec(function(error, docs) {
		if (error) {
			console.log(error);
			callback(error);
		} else {
			console.log(docs);
			callback(null, docs);
		}
	});
});

/**
 * Virtual methods
 */
TimeSeries.method('getSeconds', function(from, to) {
	var data = [];
	var year = this.hour.getFullYear();
	var month = this.hour.getMonth();
	var day = this.hour.getDate();
	var hour = this.hour.getHours();

	var fromMinute = from.getMinutes();
	var fromSecond = from.getSeconds();

	var self = this;
	function getSeconds(seconds, start, minute) {
		var arry = [];

		for (var second = 0; second < seconds.length; second++) {
			var d = seconds[second];
			var timestamp = new Date(year, month, day, hour, minute, second + start);
			arry.push([timestamp.getTime(), d]);

		};
		return arry;
	}

	var minuteStart = roundHour(from).getTime() == roundHour(self.hour).getTime() ? fromMinute : 0;

	for (var minute = minuteStart; minute < this.values.length; minute++) {
		if (roundHour(to).getTime() == roundHour(self.hour).getTime()) {

			var secondStart = minute == from.getMinutes() ? (from.getSeconds() + 2) : 2;
			var secondEnd = minute == to.getMinutes() ? (to.getSeconds() + 2) : 62;

			var arry = getSeconds(this.values[minute].slice(secondStart, secondEnd), secondStart - 2, minute);

			data = data.concat(arry);

			if (secondEnd !== 62) {
				return data;
			}
		} else {
			var arry = getSeconds(this.values[minute].slice(2), 2, minute);
			data = data.concat(arry);
		}
	};

	return data;
});

TimeSeries.method('getMinutes', function(from, to, type) {
	var data = [];
	var year = this.hour.getFullYear();
	var month = this.hour.getMonth();
	var day = this.hour.getDate();
	var hour = this.hour.getHours();

	var fromMinute = from.getMinutes();

	var self = this;

	var minuteStart = roundHour(from).getTime() == roundHour(self.hour).getTime() ? fromMinute : 0;

	for (var minute = minuteStart; minute < this.values.length; minute++) {

		var total_samples = this.values[minute][1];
		var num_samples = this.values[minute][0];
		var timestamp = new Date(year, month, day, hour, minute).getTime();
		switch (type) {
		case "avg":

			var d = total_samples / num_samples;
			data.push([timestamp, d]);
			break;
		case "sum":
		default:
			data.push([timestamp, total_samples]);
		}

		if (roundHour(to).getTime() == roundHour(self.hour).getTime()) {
			if (hour == to.getHours() && minute == to.getMinutes()) {
				return data;
			}
		}

	};

	return data;
});

TimeSeries.method('getHours', function(type) {
	switch (type) {
	case "avg":
		return [this.hour.getTime(), this.total_samples / this.num_samples];
		break;
	case "sum":
	default:
		return [this.hour.getTime(), this.total_samples];
	}
});

TimeSeries.static('seconds', function(request, callback) {
	var self = this;

	this.getData(request, function(err, docs) {

		if (err) {
			return callback(err);
		}
		var data = [];

		docs.forEach(function(doc) {
			doc.getSeconds(request.from, request.to).forEach(function(row) {
				data.push(row);
			});
		});
		callback(null, data);
	});
});

TimeSeries.static('minutes', function(request, callback) {
	var self = this;

	this.getData(request, function(err, docs) {

		if (err) {
			return callback(err);
		}
		var data = [];

		docs.forEach(function(doc) {
			doc.getMinutes(request.from, request.to, request.type).forEach(function(row) {
				data.push(row);
			});
		});
		callback(null, data);
	});
});

TimeSeries.static('hours', function(request, callback) {
	var self = this;

	this.getData(request, function(err, docs) {

		if (err) {
			return callback(err);
		}
		var data = [];

		docs.forEach(function(doc) {
			data.push(doc.getHours(request.type));
		});
		callback(null, data);
	});
});
TimeSeries.static('days', function(request, callback) {
	var self = this;

	this.getData(request, function(err, docs) {

		if (err) {
			return callback(err);
		}

		var days = {};

		var data = [];

		docs.forEach(function(doc) {

			var day = new Date(doc.hour.getFullYear(), doc.hour.getMonth(), doc.hour.getDate());
			if (!days[day]) {
				days[day] = {
					total_samples : 0,
					num_samples : 0,
					day : day
				};
			}
			days[day].total_samples += doc.total_samples;
			days[day].num_samples += doc.num_samples;

		});

		Object.keys(days).forEach(function(day) {
			switch (request.type) {
			case "avg":
				var d = days[day].total_samples / days[day].num_samples;
				data.push([days[day].day.getTime(), d instanceof Number ? d : 0]);
				break;
			case "sum":
			default:
				data.push([days[day].day.getTime(), days[day].total_samples]);
			}
		});
		callback(null, data);
	});
});

TimeSeries.static('latest', function(request, callback) {

	var date = new Date();
	var t = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() - 3);

	var self = this;

	var condition = {

	};
	this.find(condition).limit(1).select('values').sort({
		'hour' : -1
	}).exec(function(error, docs) {

		if (error) {
			return callback(error);
		}
		if (docs.length) {
			var doc = docs[0];
			switch (request.type) {
			case "avg":
				var d = doc.values[date.getMinutes()][date.getSeconds()] / (doc.values[date.getMinutes()][0] / date.getSeconds());

				console.log(doc.values[date.getMinutes()][date.getSeconds()] / doc.values[date.getMinutes()][0])

				callback(null, [t.getTime(), d instanceof Number ? d : 0]);
				break;
			case "sum":
			default:
				callback(null, [t.getTime(), doc.values[date.getMinutes()][date.getSeconds()]]);
			}

		} else {
			callback(new Error('No docs found'));
		}

	});
});

TimeSeries.static('max', function(request, callback) {

	var condition = {
		'$and' : [{
			'hour' : {
				$gte : request.from
			}
		}, {
			'hour' : {
				$lte : request.to
			}
		}]
	};
	this.find(condition).limit(1).select('max').sort({
		'max' : -1
	}).exec(function(error, doc) {
		if (error)
			callback(error);
		else if (doc.length == 1) {
			callback(null, doc[0].max);
		} else
			callback(null, NaN);
	});
});
TimeSeries.static('min', function(request, callback) {

	var condition = {
		'$and' : [{
			'hour' : {
				$gte : request.from
			}
		}, {
			'hour' : {
				$lte : request.to
			}
		}]
	};
	this.find(condition).limit(1).select('min').sort({
		'min' : -1
	}).exec(function(error, doc) {
		if (error)
			callback(error);
		else if (doc.length == 1) {
			callback(null, doc[0].min);
		} else
			callback(null, NaN);
	});
});

var TimeSeriesModel = function(collection, options) {

	var model,
	    schema;
	var isNew = false;

	/**
	 * Methods
	 */

	/**
	 * Model initialization
	 */
	function init(collection, options) {
		if (mongoose.connection.modelNames().indexOf(collection) >= 0) {
			model = mongoose.connection.model(collection);

		} else {
			isNew = true;
			model = mongoose.model(collection, TimeSeries);
		}
	}

	/**
	 * Push new value to collection
	 */
	var push = function push(timestamp, value, metadata, cb) {
		model.push(timestamp, value, metadata, cb);
	};
	/**
	 * inc value to collection
	 */
	var inc = function inc(timestamp, value, metadata, cb) {
		model.inc(timestamp, value, metadata, cb);
	};

	/**
	 *  Find data of given period
	 */
	var seconds = function(options, cb) {
		model.seconds(options, cb);
	};
	var minutes = function(options, cb) {
		model.minutes(options, cb);
	};
	var hours = function(options, cb) {
		model.hours(options, cb);
	};
	var days = function(options, cb) {
		model.days(options, cb);
	};
	/**
	 * min max
	 */
	var latest = function(options, cb) {
		model.latest(options, cb);
	};
	/**
	 * min max
	 */
	var min = function(options, cb) {
		model.min(options, cb);
	};
	var max = function(options, cb) {
		model.max(options, cb);
	};

	var getModel = function() {
		return model;
	};

	init(collection, options);

	/* Return model api */
	return {
		push : push,
		inc : inc,
		seconds : seconds,
		hours : hours,
		days : days,
		minutes : minutes,
		max : max,
		min : min,
		latest : latest,
		model : model
	};
};
module.exports = TimeSeriesModel;

