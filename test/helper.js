'use strict';

var exec = require('child_process').exec

var startServer = function(done) {
    this.timeout(15000)
    exec('sudo service prosody start', function() {
        setTimeout(function() {
            done()
        }, 300)
    })
}

var stopServer = function(done) {
    this.timeout(15000)
    exec('sudo service prosody stop', function() {
        done()
    })
}

module.exports = {
    startServer: startServer,
    stopServer: stopServer
}
