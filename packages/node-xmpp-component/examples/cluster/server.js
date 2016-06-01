'use strict'

var cluster = require('cluster')
var config = require('./config')
var numWorkers = config.workers > -1 ? config.workers : require('os').cpus().length

cluster.setupMaster({
  exec: 'worker.js',
  silent: false
})

for (var i = 0; i < numWorkers; i++) {
  cluster.fork()
}

cluster.on('online', function (worker) {
  console.log('worker', worker.process.pid, 'online')
})

cluster.on('listening', function (worker, address) {
  console.log('worker', worker.process.pid, 'listening on', address.address + ':' + address.port)
})

cluster.on('disconnect', function (worker) {
  console.log('worker', worker.process.pid, 'offline')
})

cluster.on('exit', function (worker, code, signal) {
  if (worker.suicide) {
    return console.log('worker', worker.process.pid, 'suicided')
  }

  console.log('worker', worker.process.pid, 'died', signal || code)

  if (config.restart) {
    cluster.fork()
  }
})
