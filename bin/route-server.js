#!/usr/bin/env node


var raft = require('raft');
var path = require('path');
var Router = require('../');

process.configPath = process.argv[2];

raft.start();
var rotuer = new Router();
setTimeout(function() {
	rotuer.start();
	console.log(' * Router Master/Worker listing. View logger for more infomation.');
}, 1000);
