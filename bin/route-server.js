#!/usr/bin/env node

var raft = require('raft');
var path = require('path');
var Router = require('../');

raft.common.printLogo();

raft.once('start', function() {
var rotuer = new Router();
rotuer.start();
});

console.log(process.argv[2])

raft.start(process.argv[2]||process.argv[1]);
