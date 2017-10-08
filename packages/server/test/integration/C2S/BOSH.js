'use strict'

/* global describe, it */

const XMPP = require('../../..')
const Server = XMPP.C2S.BOSHServer
const Client = require('@xmpp/client')

const server = new Server({
  autostart: false,
  port: 5285,
})
server.on('connection', (connection) => {
  connection.on('authenticate', (opts, cb) => {
    cb(null, opts)
  })

  connection.on('stanza', (stanza) => {
    stanza.attrs.from = server.jid
    stanza.attrs.to = connection.jid
    connection.send(stanza)
  })
})

describe('C2S BOSH server client', () => {
  describe('server', () => {
    it('should listen', (done) => {
      server.listen(done)
    })
  })

  describe('client', () => {
    let client

    it('should connect', (done) => {
      client = new Client({
        jid: 'foo@localhost',
        password: 'password',
        bosh: {
          url: 'http://localhost:5285/http-bind',
        },
      })
      client.once('error', done)
      client.on('online', () => {
        done()
      })
    })
    it('should disconnect when server shuts down', (done) => {
      client.once('offline', done)
      server.shutdown()
    })
  })
})
