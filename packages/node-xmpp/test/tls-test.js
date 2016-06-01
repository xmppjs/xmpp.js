'use strict'

/* global describe, it, before */

var assert = require('assert')
var xmpp = require('../index')
var pem = require('pem')

var user = {
  jid: 'me@localhost',
  password: 'secret'
}

var tls
var C2S_PORT = 45552

before(function (done) {
  var certParams = {
    days: 1,
    selfSigned: true,
    altNames: ['localhost', '127.0.0.1']
  }
  pem.createCertificate(certParams, function (err, keys) {
    if (err) return done(err)
    tls = {key: keys.serviceKey + '\n', cert: keys.certificate + '\n'}
    tls.ca = tls.cert
    done()
  })
})

var c2s = null

function startServer (done) {
  // Sets up the server.
  c2s = new xmpp.server.C2S.TCPServer({
    domain: 'localhost',
    requestCert: true,
    rejectUnauthorized: false,
    tls: tls,
    port: C2S_PORT
  })

  c2s.on('connection', function (client) {
    client.once('authenticate', function (opts, cb) {
      if ((opts.saslmech = 'PLAIN') &&
        (opts.jid.toString() === user.jid) &&
        (opts.password === user.password)) {
        cb(null, opts)
      } else {
        cb()
      }
    })

    client.on('online', function () {
      c2s.emit('test', client)
      client.send(new xmpp.Message({type: 'chat'})
        .c('body')
        .t('Hello there, little client.')
      )
    })
  })

  c2s.listen(done)
}

describe('TLS', function () {
  before(function (done) {
    startServer(done)
  })

  // FIXME fails on Node.js 0.12 and 4.0
  // after(function (done) {
  //   c2s.shutdown(done)
  // })

  describe('server', function () {
    it('should go online', function (done) {
      c2s.once('test', function (client) {
        assert.ok(
          cl.connection.socket.authorized,
          'Client should have working tls'
        )
        assert.ok(
          client.connection.socket.authorized,
          'Server should have working tls'
        )
        done()
      })
      var cl = new xmpp.Client({
        jid: user.jid,
        password: user.password,
        credentials: tls,
        port: C2S_PORT,
        host: 'localhost'
      })
      cl.on('error', function (e) {
        done(e)
      })
    })

    it('should accept plain authentication', function (done) {
      var cl = new xmpp.Client({
        jid: user.jid,
        password: user.password,
        port: C2S_PORT,
        host: 'localhost'
      })
      cl.once('online', function () {
        done()
      })
      cl.once('error', function (e) {
        done(e)
      })
    })

    it('should not accept plain authentication', function (done) {
      var cl = new xmpp.Client({
        jid: user.jid,
        password: user.password + 'abc',
        port: C2S_PORT,
        host: 'localhost'
      })

      cl.once('online', function () {
        done(new Error('should not allow any authentication'))
      })

      cl.once('error', function (err) {
        // assert(err instanceof Error) FIXME should be an instance of Error
        assert.equal(err.toString(), 'XMPP authentication failure')
        done()
      })
    })
  })
})
