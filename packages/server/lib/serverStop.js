'use strict'

module.exports = function (server) {
  var connections = server.__connections = new Set()
  server.on('connection', function (connection) {
    if (server.__closing === true) {
      connection.destroy()
    }

    connections.add(connection)
    connection.once('close', function () {
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
