/* global describe, it, beforeEach, afterEach */

'use strict'

var Client = require('../../index')
var helper = require('../helper')
var Element = require('node-xmpp-core').Stanza.Element

require('should')

describe.skip('Websocket connections', function () {
  var jid = Math.random().toString(36).substring(7) + '@localhost'
  var password = 'password'
  var client = null
  var resource = 'test'

  beforeEach(function (done) {
    helper.startServer(done)
  })

  afterEach(function (done) {
    if (client) client.end()
    helper.stopServer(done)
  })

  it('Can register an account', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      register: true,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })
    client.on('online', function (data) {
      var bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      done()
    })
  })

  it('Errors on bad authentication details', function (done) {
    client = new Client({
      jid: jid,
      password: 'not ' + password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })
    client.on('online', function () {
      done('Should not have connected')
    })
    client.on('error', function (error) {
      error.should.equal(
        'XMPP authentication failure'
      )
      done()
    })
  })

  it('Can connect to an account with resource', function (done) {
    client = new Client({
      jid: jid + '/' + resource,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })
    client.on('online', function (data) {
      var bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      data.jid.resource.should.equal(resource)
      done()
    })
  })

  it('Can connect to an account without resource', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })
    client.on('online', function (data) {
      var bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      data.jid.resource.should.exist
      done()
    })
  })

  it('Fails on registering a duplicate account', function (done) {
    client = new Client({
      jid: jid,
      password: 'not ' + password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      },
      register: true
    })
    client.on('online', function () {
      done('Should not have connected')
    })
    client.on('error', function (error) {
      error.message.should.equal(
        'Registration error'
      )
      done()
    })
  })

  it('Can send and receive a stanza', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })

    var ping = new Element(
      'iq', { id: '123', type: 'get' }
    ).c('ping', { xmlns: 'urn:xmpp:ping' })

    client.on('online', function () {
      client.send(ping)
      client.on('stanza', function (pong) {
        pong.attrs.id.should.equal('123')
        done()
      })
    })
  })

  it('Can send and receive stanzas', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })

    var ping = new Element(
      'iq', { id: '123', type: 'get' }
    ).c('ping', { xmlns: 'urn:xmpp:ping' })

    var counter = 0
    client.on('online', function () {
      client.send(ping)
      client.on('stanza', function () {
        ++counter
        if (counter > 6) return done()
        client.send(ping)
      })
    })
  })

  it('Sends error for bad stanza', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })

    var badPing = new Element(
      'wtf', { id: '123', type: 'get' }
    ).c('ping', { xmlns: 'urn:xmpp:ping' })

    client.on('online', function () {
      client.send(badPing)
      client.on('stanza', function (stanza) {
        stanza.attrs.type.should.equal('error')
        stanza.attrs.id.should.equal('123')
        done()
      })
    })
  })

  it('Errors when server is stopped', function (done) {
    helper.stopServer(function () {
      client = new Client({
        jid: jid,
        password: password,
        websocket: {
          url: 'ws://localhost:5280/xmpp-websocket'
        }
      })
      client.on('error', function (error) {
        error.message.should.equal('connect ECONNREFUSED')
        error.code.should.equal('ECONNREFUSED')
        error.errno.should.equal('ECONNREFUSED')
        error.syscall.should.equal('connect')
        done()
      })
      client.on('online', function () {
        done('Should not have connected')
      })
    })
  })

  it('Errors when providing bad BOSH url', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })
    client.on('error', function (error) {
      error.message.should.equal('HTTP status 404')
      done()
    })
    client.on('online', function () {
      done('Should not have connected')
    })
  })

  it.skip('Disconnects', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })

    var ping = new Element(
      'iq', { id: '123', type: 'get' }
    ).c('ping', { xmlns: 'urn:xmpp:ping' })

    client.on('online', function () {
      client.end()
      client.send(ping)
      client.on('stanza', function () {
        done('Unexpected stanza')
      })
      done()
    })
  })
})
