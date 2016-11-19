'use strict'

/* global describe, it */

var XMPP = require('../../..')
var Server = XMPP.C2S.BOSHServer
var Client = require('node-xmpp-client')

var server = new Server({
  autostart: false,
  port: 5285
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

describe('C2S BOSH server client', function () {
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
        bosh: {
          url: 'http://localhost:5285/http-bind'
        }
      })
      client.once('error', done)
      client.on('online', function () {
        done()
      })
    })
  // FIXME
  // it('should disconnect when server shuts down', function(done) {
  //     client.once('offline', done)
  //     server.shutdown()
  // })
  })
})
