'use strict'

require('es6-collections')

/*
 * https://github.com/joyent/node/issues/9066
 * we understand this is not a Node.js bug
 * but users will expect the close method
 * to work equally on TCP/BOSH/WebSocket C2S servers
*/
module.exports = function (server) {
  var connections = server.__connections = new Set()
  server.on('connection', function (connection) {
    if (server.__closing === true) {
      connection.destroy()
    }

    connections.add(connection)
    connection.on('close', function () {
      connections.delete(connection)
    })
  })
  server.stop = function () {
    server.__closing = true
    server.once('close', function () {
      server.__closing = false
    })
    connections.forEach(function (connection) {
      connection.destroy()
    })
  }
  return server
}
