'use strict'

var exec = require('child_process').exec

var startServer = function (done) {
  exec('~/prosody/bin/prosodyctl start', function () {
    setTimeout(function () {
      done()
    }, 500)
  })
}

var stopServer = function (done) {
  exec('~/prosody/bin/prosodyctl stop', function () {
    setTimeout(function () {
      done()
    }, 100)
  })
}

module.exports = {
  startServer: startServer,
  stopServer: stopServer
}
