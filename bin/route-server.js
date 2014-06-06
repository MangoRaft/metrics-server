#!/usr/bin/env node

var raft = require('raft');
var path = require('path');
var Router = require('../');

raft.common.printLogo();

raft.once('start', function() {
	var rotuer = new Router();
	rotuer.start();
});


raft.start(process.argv[2]);
