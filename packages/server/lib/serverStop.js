'use strict'

module.exports = function (server) {
  const connections = server.__connections = new Set()
  server.on('connection', (connection) => {
    if (server.__closing === true) {
      connection.destroy()
    }

    connections.add(connection)
    connection.once('close', () => {
      connections.delete(connection)
    })
  })
  server.stop = function () {
    server.__closing = true
    server.once('close', () => {
      server.__closing = false
    })
    connections.forEach((connection) => {
      connection.destroy()
    })
  }
  return server
}
