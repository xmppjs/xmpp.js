'use strict'

var exec = require('child_process').exec

var startServer = function (done) {
  exec('sudo service prosody start', function () {
    setTimeout(function () {
      done()
    }, 500)
  })
}

var stopServer = function (done) {
  exec('sudo service prosody stop', function () {
    setTimeout(function () {
      done()
    }, 100)
  })
}

module.exports = {
  startServer: startServer,
  stopServer: stopServer
}
