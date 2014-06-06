/*
 *
 * (C) 2013, MangoRaft.
 *
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Metric = new Schema({
	time : {
		type : Date,
		required : true,
		'default' : Date.now
	},
	group : {
		type : String,
		required : true,
		'default' : 'default'
	},
	metric : Number,
	name : String,
	token : String
});

module.exports = mongoose.model('Metric', Metric);

//module.exports.remove(function(){})
