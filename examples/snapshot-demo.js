var raft = require('raft')
var path = require('path')
var Router = require('../')

process.configPath = __dirname + '/../../tests/config.json'

raft.start()
var rotuer = new Router()
setTimeout(function() {

	rotuer.start()
}, 1000)
