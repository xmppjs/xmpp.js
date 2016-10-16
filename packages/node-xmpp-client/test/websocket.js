'use strict'

/* global describe, it, beforeEach, afterEach */

var Server = require('node-xmpp-server').C2S.WebSocketServer
var Client = require('../index')

var PORT = 5290
var server

function startServer (done) {
  server = new Server({
    port: PORT,
    domain: 'localhost'
  })
  server.on('online', done)
  server.on('connection', function (conn) {
    conn.on('authenticate', function (opts, cb) {
      cb(null, opts)
    })
  })
}

function stopServer (cb) {
  server.shutdown(cb)
}

describe('C2S WebSocket with node-xmpp-server', function () {
  beforeEach(function (done) {
    startServer(done)
  })

  afterEach(function (done) {
    stopServer(done)
  })

  it('connects', function (done) {
    var client = new Client({
      jid: 'sonny@localhost',
      password: 'foo',
      websocket: {
        url: 'ws://localhost:' + PORT
      }
    })
    client.on('online', function () {
      done()
    })
  })
})
