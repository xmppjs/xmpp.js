'use strict'

/* global describe, it */

var XMPP = require('../../..')
var Server = XMPP.C2S.WebSocketServer
var Client = require('node-xmpp-client')

var server = new Server({
  autostart: false
})
server.on('connection', function (connection) {
  connection.on('authenticate', function (opts, cb) {
    cb(null, opts)
  })

  connection.on('stanza', function (stanza) {
    stanza.attrs.from = server.jid
    stanza.attrs.to = connection.jid
    connection.send(stanza)
  })
})

describe('C2S WebSocket server client', function () {
  describe('server', function () {
    it('should listen', function (done) {
      server.listen(done)
    })
  })

  describe('client', function () {
    var client

    it('should connect', function (done) {
      client = new Client({
        jid: 'foo@localhost',
        password: 'password',
        websocket: {
          url: 'ws://localhost:5290'
        }
      })
      client.on('error', done)
      client.on('online', function () {
        done()
      })
    })
    it('should disconnect when server shuts down', function (done) {
      client.once('offline', done)
      server.shutdown()
    })
  })
})
