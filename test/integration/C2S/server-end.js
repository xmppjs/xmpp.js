'use strict'

/* global describe, it, afterEach */

var assert = require('assert')
var TCPServer = require('../../../lib/C2S/TCP/Server')
var WebSocketServer = require('../../../lib/C2S/WebSocket/Server')
var BOSHServer = require('../../../lib/C2S/BOSH/Server')
var Client = require('node-xmpp-client')

var PORT = 6767

function makeServer (Server) {
  var server = new Server({port: PORT, autostart: false})
  server.on('connection', function (connection) {
    connection.on('authenticate', function (creds, cb) {
      cb(null, creds)
    })
  })
  return server
}

describe('server end', function () {
  var server
  var client

  describe('TCP server', function () {
    afterEach(function () {
      client.end()
      client = null
    })

    it('disconnects all clients', function (done) {
      server = makeServer(TCPServer)
      server.listen(function (err) {
        if (err) return done(err)
        client = new Client({
          jid: 'TCP@localhost',
          password: 'TCP',
          port: PORT,
          host: 'localhost'
        })
        client.on('online', function () {
          client.on('error', function () { })
          server.end()
          client.on('close', done)
        })
      })
    })

    it('closes the port', function (done) {
      server = makeServer(TCPServer)
      server.listen(function (err) {
        if (err) return done(err)
        server.end()
        client = new Client({
          jid: 'TCP@localhost',
          password: 'TCP',
          port: PORT,
          host: 'localhost'
        })
        client.on('error', function (err) {
          assert.equal(err.errno, 'ECONNREFUSED')
          done()
        })
      })
    })
  })

  describe('WebSocket server', function () {
    it('disconnects all clients', function (done) {
      server = makeServer(WebSocketServer)
      server.listen(function (err) {
        if (err) return done(err)
        client = new Client({
          jid: 'WebSocket@localhost',
          password: 'WebSocket',
          websocket: {
            url: 'ws://localhost:' + PORT
          }
        })
        client.on('online', function () {
          server.end()
          client.on('close', done)
        })
      })
    })
    it('closes the port', function (done) {
      server = makeServer(TCPServer)
      server.listen(function (err) {
        if (err) return done(err)
        server.end()
        client = new Client({
          jid: 'WebSocket@localhost',
          password: 'WebSocket',
          websocket: {
            url: 'ws://localhost:' + PORT
          }
        })
        client.on('error', function (err) {
          assert(err.message.indexOf('ECONNREFUSED') !== -1)
          done()
        })
      })
    })
  })

  describe('BOSH server', function () {
    it('disconnects all clients', function (done) {
      server = makeServer(BOSHServer)
      server.listen(function (err) {
        if (err) return done(err)
        client = new Client({
          jid: 'BOSH@localhost',
          password: 'BOSH',
          bosh: {
            url: 'http://localhost:' + PORT + '/http-bind'
          }
        })
        client.on('online', function () {
          server.end()
          client.on('close', done)
          client.end() // FIXME client tries to reconnect
        })
      })
    })
    it('closes the port', function (done) {
      server = makeServer(BOSHServer)
      server.listen(function (err) {
        if (err) return done(err)
        server.end()
        client = new Client({
          jid: 'WebSocket@localhost',
          password: 'WebSocket',
          bosh: {
            url: 'http://localhost:' + PORT
          }
        })
        client.on('error', function (err) {
          assert(err.message.indexOf('ECONNREFUSED') !== -1)
          done()
        })
      })
    })
  })
})
