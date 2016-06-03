'use strict'

var exec = require('child_process').exec
var delay = 500

var startServer = function (done) {
  done = done || function () {}

  exec('sudo prosodyctl start', function (err, stdout, stderr) {
    if (err && stdout.indexOf('Prosody is already running') !== 0) {
      console.error(err.message, stderr, stdout)
      return done(err)
    }

    setTimeout(function () {
      done()
    }, delay)
  })
}

var stopServer = function (done) {
  done = done || function () {}

  exec('sudo prosodyctl stop', function (err, stdout, stderr) {
    if (err && stdout !== 'Prosody is not running\n') {
      console.error(err, stderr, stdout)
      return done(err)
    }

    setTimeout(function () {
      done()
    }, delay)
  })
}

module.exports = {
  startServer: startServer,
  stopServer: stopServer
}
