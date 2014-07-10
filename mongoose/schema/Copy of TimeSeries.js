/*
 *
 * (C) 2013, MangoRaft.
 *
 */
require('sugar');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = mongoose.Schema.Types.Mixed;

var options = {
	actor : 0,
	interval : 1, // seconds
	millisecond : false,
	verbose : false,
	postProcessImmediately : false,
	paths : {
		value : {
			type : 'number'
		},
		metadata : {
			type : Mixed
		}
	}
};

var roundDay = function(d) {
	var t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	return t;
};

function getInitializer(val) {
	var updates = {};
	if (val !== null) {
		val = {
			value : val
		};
	}
	updates.seconds = [];
	for (var i = 0; i < 24; i++) {
		updates.seconds[i] = [];
		for (var j = 0; j < 60; j++) {
			updates.seconds[i][j] = [];
			//initialize length
			for (var k = 0; k < 60; k++) {
				updates.seconds[i][j][k] = val;
			};

			//initialize length
		}

	}

	return updates;
}

function getUpdates(timestamp, value, inc) {

	var updates = {};

	var set = {
		value : value
	};

	//statistics
	updates['updatedAt.date'] = new Date();
	updates['latest.timestamp'] = timestamp;
	updates['latest.value'] = value;

	updates['$inc'] = {
		'statistics.i' : 1
	};

	if (inc) {
		updates['$inc']['seconds.' + timestamp.getHours() + '.' + timestamp.getMinutes() + '.' + timestamp.getSeconds() + '.value'] = value;
	} else {
		updates['seconds.' + timestamp.getHours() + '.' + timestamp.getMinutes() + '.' + timestamp.getSeconds()] = set;
	}
	return updates;
}

/**
 * Schema definition
 */
var TimeSeries = new Schema({
	day : {
		type : Date,
		index : true,
		required : true
	},
	metadata : {
		interval : {
			type : Number
		}
	},
	latest : {
		timestamp : {
			type : Date
		},
		value : {
			type : Number,
			'default' : 0
		},
		metadata : {
			type : Mixed
		},
	},
	createdAt : {
		date : {
			type : Date,
			'default' : Date
		},
		user : {
			type : String
		}
	},
	updatedAt : {
		date : {
			type : Date
		},
		user : {
			type : String
		}
	},
	statistics : {
		i : {
			type : Number,
			'default' : 0
		},
		avg : {
			type : Number
		},
		max : {
			value : {
				type : Number
			},
			timestamp : {
				type : Date
			}
		},
		min : {
			value : {
				type : Number
			},
			timestamp : {
				type : Date
			}
		}
	},
	seconds : [Schema.Types.Mixed]
});

/**
 * Post hook.
 */
TimeSeries.pre('save', function(next) {
	//console.log(this);
	if (this.isNew) {
		//console.log('saving new..');
		this.metadata.interval = options.interval;
		this.statistics.i = 1;
		if (this.latest) {
			this.statistics.min.value = this.latest.value;
			this.statistics.min.timestamp = this.latest.timestamp;
			this.statistics.max.value = this.latest.value;
			this.statistics.max.timestamp = this.latest.timestamp;
			this.statistics.avg = this.latest.value;
		}
	} else {

		//console.log('updating old..');
	}

	next();
});

/**
 * Virtual methods
 */
TimeSeries.method('getData', function(interval, format) {
	var data = [];
	var year = this.day.getFullYear();
	var month = this.day.getMonth();
	var day = this.day.getDate();
	var dateObj = new Date();
	var self = this;
	function getSeconds(seconds, minute, hour, reduce) {
		var arry = [];
		for (var second = 0; second < seconds.length; second++) {
			if (roundDay(dateObj).getTime() == roundDay(self.day).getTime()) {
				if (hour == dateObj.getHours() && minute == dateObj.getMinutes() && second == dateObj.getSeconds()) {
					console.log(roundDay(dateObj).getTime(), hour, minute, second)
					return arry;
				}
			}
			var d = seconds[second];

			if (reduce) {
				arry.push( d ? d.value : d);
			} else {
				var timestamp = new Date(year, month, day, hour, minute, second);
				arry.push([timestamp.getTime(), d ? d.value : d]);
			}
		};
		return arry;
	}

	if (interval == 'second') {
		for (var hour = 0; hour < this.seconds.length; hour++) {
			for (var minute = 0; minute < this.seconds[hour].length; minute++) {

				var arry = getSeconds(this.seconds[hour][minute], minute, hour);

				data = data.concat(arry);
				console.log(minute, arry.length)
				if (arry.length !== 60) {
					return data;
				}
			};
		};
	}
	if (interval == 'minute') {
		for (var hour = 0; hour < this.seconds.length; hour++) {
			for (var minute = 0; minute < this.seconds[hour].length; minute++) {
				var minuteSum = 0
				var arry = getSeconds(this.seconds[hour][minute], minute, hour, true);

				if (arry.length) {
					if (format == 'sum') {
						minuteSum += arry.reduce(function(previousValue, currentValue, index, array) {
							return previousValue + currentValue;
						});
					} else {
						minuteSum += arry.reduce(function(previousValue, currentValue, index, array) {
							return previousValue + currentValue;
						}) / arry.length;
					}
				}
				var timestamp = new Date(year, month, day, hour, minute, 0);
				data.push([timestamp.getTime(), Number(minuteSum.toFixed(2))]);
				if (arry.length !== 60) {
					return data;
				}
			};
		};
	}
	if (interval == 'hour') {
		for (var hour = 0; hour < this.seconds.length; hour++) {
			var hourSum = 0
			var i = 1
			var shouldReturn = false
			for (var minute = 0; minute < this.seconds[hour].length; minute++) {
				var arry = getSeconds(this.seconds[hour][minute], minute, hour, true);

				if (arry.length) {
					if (format == 'sum') {
						hourSum += arry.reduce(function(previousValue, currentValue, index, array) {
							return previousValue + currentValue;
						});
					} else {
						hourSum += arry.reduce(function(previousValue, currentValue, index, array) {
							return previousValue + currentValue;
						}) / arry.length;
					}
				}
				i++;
				if (arry.length !== 60) {
					shouldReturn = true
				}
			};
			if (format !== 'sum') {
				hourSum = hourSum / i;
			}
			var timestamp = new Date(year, month, day, hour, 0, 0);
			data.push([timestamp.getTime(), Number(hourSum.toFixed(2))]);
			if (shouldReturn) {
				return data;
			}
		};
	}

	if (interval == 'day') {
		var daySum = 0;
		var i = 0;
		var shouldReturn = false;
		for (var hour = 0; hour < this.seconds.length; hour++) {

			for (var minute = 0; minute < this.seconds[hour].length; minute++) {
				var arry = getSeconds(this.seconds[hour][minute], minute, hour, true);
				if (arry.length) {
					if (format == 'sum') {
						daySum += arry.reduce(function(previousValue, currentValue, index, array) {
							return previousValue + currentValue;
						});
					} else {
						daySum += arry.reduce(function(previousValue, currentValue, index, array) {
							return previousValue + currentValue;
						}) / arry.length;
					}
				}
				i++;
			};

		};
		if (format !== 'sum') {
			daySum = daySum / i;
		}
		var timestamp = new Date(year, month, day, 0, 0, 0);

		data.push([timestamp.getTime(), Number(daySum.toFixed(2))]);

	}
	return data;
});

/**
 * Static methods
 */
TimeSeries.static('findMax', function(conditions, callback) {
	var condition = {
		'$and' : [{
			'day' : {
				$gte : conditions.from
			}
		}, {
			'day' : {
				$lte : conditions.to
			}
		}]
	};
	//console.log('findMax: '+JSON.stringify(condition));
	this.find(condition).limit(1).select('statistics.max').sort({
		'statistics.max.value' : -1
	}).exec(function(error, doc) {
		if (error)
			callback(error);
		else if (doc.length == 1) {
			callback(null, doc[0].statistics.max);
		} else
			callback(null, NaN);
	});
});
TimeSeries.static('findMin', function(conditions, callback) {
	var condition = {
		'$and' : [{
			'day' : {
				$gte : conditions.from
			}
		}, {
			'day' : {
				$lte : conditions.to
			}
		}]
	};
	console.log('findMin: ' + JSON.stringify(condition));
	this.find(condition).limit(1).select('statistics.min').sort({
		'statistics.min.value' : 1
	}).exec(function(error, doc) {
		if (error)
			callback(error);
		else if (doc.length == 1) {
			callback(null, doc[0].statistics.min);
		} else
			callback(null, NaN);
	});
});
TimeSeries.static('findData', function(request, callback) {

	var condition = {
		'$and' : []
	};
	if (!request.to)
		request.to = new Date();
	if (!request.dir)
		request.dir = 1;
	if (Object.keys(request.condition || {}).length > 0)
		condition['$and'].push(request.condition);
	condition['$and'].push({
		'day' : {
			'$gte' : request.from,
		}
	});
	condition['$and'].push({
		'day' : {
			'$lte' : request.to,
		}
	});

	if (options.verbose) {
		console.log(request);
		console.log(JSON.stringify(condition));
	}

	this.find(condition).sort({
		'day' : request.dir
	}).exec(function(error, docs) {
		if (error) {
			callback(error);
		} else {
			if (options.verbose)
				console.log('Doc count: ' + docs.length);

			var data = [], i;

			docs.forEach(function(doc) {
				doc.getData(request.interval, request.format).forEach(function(row) {
					data.push(row);
				});
			});
			callback(null, data);
		}
	});
});

TimeSeries.method('minmax', function(timestamp, value) {

	var updates = {}, needToSave = false;
	if (!isNaN(this.statistics.max.value)) {
		if (value > this.statistics.max.value) {
			updates['statistics.max.timestamp'] = timestamp;
			updates['statistics.max.value'] = value;
			needToSave = true;
		}
	} else {
		updates['statistics.max.timestamp'] = timestamp;
		updates['statistics.max.value'] = value;
		needToSave = true;
	}
	if (!isNaN(this.statistics.min.value)) {
		if (value < this.statistics.min.value) {
			updates['statistics.min.timestamp'] = timestamp;
			updates['statistics.min.value'] = value;
			needToSave = true;
		}
	} else {
		updates['statistics.min.timestamp'] = timestamp;
		updates['statistics.min.value'] = value;
		needToSave = true;
	}
	if (needToSave) {
		this.set(updates);
		this.save(function(error, ok) {
			if (error)
				console.log(error);
		});
	}
});

TimeSeries.static('push', function(timestamp, value, metadata, cb) {

	var day = roundDay(timestamp);
	var condition = {
		'day' : day
	};
	var updates = getUpdates(timestamp, value);
	var self = this;
	if (options.verbose)
		console.log('\nCond: ' + JSON.stringify(condition));
	if (options.verbose)
		console.log('Upda: ' + JSON.stringify(updates));

	this.findOneAndUpdate(condition, updates, {
		select : '_id statistics'
	}, function(error, doc) {

		if (error) {
			if (cb)
				cb(error);
		} else if (doc) {
			doc.minmax(timestamp, value);
			if (cb)
				cb(null, doc);
		} else {
			//console.log('Create new');
			var datainit = getInitializer(null);
			var doc = new self({
				day : day
			});
			doc.set(datainit);
			doc.set(updates);
			doc.save(cb);

		}
	});
});

TimeSeries.static('inc', function(timestamp, value, metadata, cb) {
	var day = roundDay(timestamp);
	var condition = {
		'day' : day
	};
	var updates = getUpdates(timestamp, value, true);
	var self = this;
	if (options.verbose)
		console.log('\nCond: ' + JSON.stringify(condition));
	if (options.verbose)
		console.log('Upda: ' + JSON.stringify(updates));

	this.findOneAndUpdate(condition, updates, {
		select : '_id statistics'
	}, function(error, doc) {

		if (error) {
			if (cb)
				cb(error);
		} else if (doc) {
			if (cb)
				cb(null, doc);
		} else {
			//console.log('Create new');
			var datainit = getInitializer(0);
			var doc = new self({
				day : day
			});
			doc.set(datainit);
			doc.set(updates);
			doc.save(cb);

		}
	});
});

var TimeSeriesModel = function(collection, options) {

	var model, schema;

	/**
	 * Methods
	 */

	/**
	 * Model initialization
	 */
	function init(collection, options) {
		if (mongoose.connection.modelNames().indexOf(collection) >= 0) {
			model = connection.model(collection);
		} else {
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
	var findData = function(options, cb) {
		model.findData(options, cb);
	};
	/**
	 * Find Max value of given period
	 */
	var findMax = function(options, cb) {
		model.findMax(options, cb);
	};
	/**
	 * Find Min value of given period
	 */
	var findMin = function(options, cb) {
		model.findMin(options, cb);
	};

	var getModel = function() {
		return model;
	};

	init(collection, options);

	/* Return model api */
	return {
		push : push,
		inc : inc,
		findData : findData,
		findMax : findMax,
		findMin : findMin,
		model : model
	};
};
module.exports = TimeSeriesModel;

