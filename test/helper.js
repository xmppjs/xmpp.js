'use strict';

var exec = require('child_process').exec

var startServer = function(done) {
    exec('sudo service prosody start', function() {
        done()
    })
}

var stopServer = function(done) {
    exec('sudo service prosody stop', function() {
        done()
    })
}

module.exports = {
    startServer: startServer,
    stopServer: stopServer
}