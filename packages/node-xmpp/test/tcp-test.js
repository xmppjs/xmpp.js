'use strict'

/* global describe, it, beforeEach, afterEach */

var assert = require('assert')
var xmpp = require('../index')
var C2S_PORT = 45552

describe('TCP client/server', function () {
  var sv = null
  var cl = null
  var svcl = null

  beforeEach(function (done) {
    sv = new xmpp.server.C2S.TCPServer({port: C2S_PORT, autostart: false})
    sv.on('connection', function (conn) {
      svcl = conn
      // Always authenticate
      conn.once('authenticate', function (opts, cb) {
        cb(null, opts)
      })
    })
    sv.listen(function (err) {
      if (err) return done(err)
      cl = new xmpp.Client({
        jid: 'test@localhost',
        password: 'test',
        host: 'localhost',
        port: C2S_PORT
      })
      cl.on('online', function () {
        done()
      })
    })
  })

  afterEach(function (done) {
    if (cl) cl.end()
    sv.shutdown(done)
  })

  describe('client', function () {
    it('should go online', function () {
      assert.ok(svcl.authenticated, 'Client should have authenticated')
    })

    it('should send a stanza', function (done) {
      var message = new xmpp.Message({to: 'foo@bar.org'})
        .c('body').t('Hello')

      svcl.once('stanza', function (stanza) {
        assert.ok(stanza.is('message'), 'Message stanza')
        assert.equal(stanza.attrs.to, 'foo@bar.org')
        assert.equal(stanza.getChildText('body'), 'Hello')
        done()
      })
      cl.send(message)
    })

    it('should receive a stanza', function (done) {
      cl.once('stanza', function (stanza) {
        assert.ok(stanza.is('message'), 'Message stanza')
        assert.equal(stanza.attrs.to, 'bar@bar.org')
        assert.equal(stanza.getChildText('body'), 'Hello back')
        done()
      })
      svcl.send(new xmpp.Message({ to: 'bar@bar.org' })
        .c('body')
        .t('Hello back'))
    })

    it('Can send plain text stanza', function (done) {
      svcl.once('stanza', function (stanza) {
        assert.ok(stanza.is('message'), 'Message stanza')
        assert.equal(stanza.attrs.to, 'foo@bar.org')
        assert.equal(stanza.getChildText('body'), 'Hello')
        done()
      })
      cl.send('<message to="foo@bar.org"><body>Hello</body></message>')
    })
  })
})
