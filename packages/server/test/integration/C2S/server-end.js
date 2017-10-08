'use strict'

/* global describe, it, afterEach */

const assert = require('assert')
const TCPServer = require('../../../lib/C2S/TCP/Server')
const WebSocketServer = require('../../../lib/C2S/WebSocket/Server')
const BOSHServer = require('../../../lib/C2S/BOSH/Server')
const Client = require('node-xmpp-client')

const PORT = 6767

function makeServer (Server) {
  const server = new Server({port: PORT, autostart: false})
  server.on('connection', (connection) => {
    connection.on('authenticate', (creds, cb) => {
      cb(null, creds)
    })
  })
  return server
}

describe('server end', () => {
  let server
  let client

  describe('TCP server', () => {
    afterEach(() => {
      client.end()
      client = null
    })

    it('disconnects all clients', (done) => {
      server = makeServer(TCPServer)
      server.listen((err) => {
        if (err) return done(err)
        client = new Client({
          jid: 'TCP@localhost',
          password: 'TCP',
          port: PORT,
          host: 'localhost',
        })
        client.on('online', () => {
          client.on('error', () => { })
          server.end()
          client.on('close', done)
        })
      })
    })

    it('closes the port', (done) => {
      server = makeServer(TCPServer)
      server.listen((err) => {
        if (err) return done(err)
        server.end()
        client = new Client({
          jid: 'TCP@localhost',
          password: 'TCP',
          port: PORT,
          host: 'localhost',
        })
        client.on('error', (err) => {
          assert.equal(err.errno, 'ECONNREFUSED')
          done()
        })
      })
    })
  })

  describe('WebSocket server', () => {
    it('disconnects all clients', (done) => {
      server = makeServer(WebSocketServer)
      server.listen((err) => {
        if (err) return done(err)
        client = new Client({
          jid: 'WebSocket@localhost',
          password: 'WebSocket',
          websocket: {
            url: `ws://localhost:${PORT}`,
          },
        })
        client.on('online', () => {
          server.end()
          client.on('close', done)
        })
      })
    })
    it('closes the port', (done) => {
      server = makeServer(TCPServer)
      server.listen((err) => {
        if (err) return done(err)
        server.end()
        client = new Client({
          jid: 'WebSocket@localhost',
          password: 'WebSocket',
          websocket: {
            url: `ws://localhost:${PORT}`,
          },
        })
        client.on('error', (err) => {
          assert(err.message.indexOf('ECONNREFUSED') !== -1)
          done()
        })
      })
    })
  })

  describe('BOSH server', () => {
    it('disconnects all clients', (done) => {
      server = makeServer(BOSHServer)
      server.listen((err) => {
        if (err) return done(err)
        client = new Client({
          jid: 'BOSH@localhost',
          password: 'BOSH',
          bosh: {
            url: `http://localhost:${PORT}/http-bind`,
          },
        })
        client.on('online', () => {
          server.end()
          client.on('close', done)
          client.end() // FIXME client tries to reconnect
        })
      })
    })
    it('closes the port', (done) => {
      server = makeServer(BOSHServer)
      server.listen((err) => {
        if (err) return done(err)
        server.end()
        client = new Client({
          jid: 'WebSocket@localhost',
          password: 'WebSocket',
          bosh: {
            url: `http://localhost:${PORT}`,
          },
        })
        client.on('error', (err) => {
          assert(err.message.indexOf('ECONNREFUSED') !== -1)
          done()
        })
      })
    })
  })
})
