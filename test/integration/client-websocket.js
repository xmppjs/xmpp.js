/* global describe, it, afterEach */

'use strict'

var Client = require('../../packages/node-xmpp-client')
var Stanza = Client.Stanza

require('should')

describe('client WebSocket', function () {
  var jid = Math.random().toString(36).substring(7) + '@localhost'
  var password = 'password'
  var client = null
  var resource = 'test'

  afterEach(function (done) {
    if (client) client.end()
    done()
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

    var ping = new Stanza(
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

    var ping = new Stanza(
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

  it.skip('Sends error for bad stanza', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket'
      }
    })

    var badPing = new Stanza(
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

  it.skip('Errors when server is stopped', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:1234/xmpp-websocket'
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

  it('Errors when providing bad url', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      websocket: {
        url: 'ws://localhost:5280/xmpp-websocket/404'
      }
    })
    client.on('error', function (error) {
      error.message.indexOf('404') > -1
      client = null
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

    var ping = new Stanza(
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
