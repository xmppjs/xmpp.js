/* global describe, it, beforeEach, afterEach */

'use strict'

var Client = require('../../index')
var helper = require('../helper')
var Element = require('node-xmpp-core').Stanza.Element

require('should')

describe('Socket connections', function () {
  var jid = Math.random().toString(36).substring(7) + '@localhost'
  var password = 'password'
  var client = null
  var resource = 'test'

  beforeEach(function (done) {
    helper.startServer(done)
  })

  afterEach(function (done) {
    helper.stopServer(done)
    if (client) client.end()
  })

  it('Can register an account', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      host: 'localhost',
      register: true
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
      host: 'localhost'
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
      host: 'localhost'
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
      host: 'localhost'
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
      host: 'localhost',
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
      host: 'localhost'
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

  it('Sends error for bad stanza', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      host: 'localhost'
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

  it("Can't connect when server is stopped", function (done) {
    helper.stopServer(function () {
      client = new Client({
        jid: jid,
        password: password,
        host: 'localhost'
      })
      client.on('error', function (error) {
        error.message.should.match(/connect ECONNREFUSED/)
        error.code.should.match(/ECONNREFUSED/)
        error.errno.should.match(/ECONNREFUSED/)
        error.syscall.should.match(/connect/)
        done()
      })
      client.on('online', function () {
        done('Should not have connected')
      })
    })
  })

  it('Disconects', function (done) {
    client = new Client({
      jid: jid,
      password: password,
      host: 'localhost'
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

  describe('Authentication', function () {
    it('Can connect using PLAIN authentication', function (done) {
      client = new Client({
        jid: jid,
        password: password,
        host: 'localhost',
        preferred: 'PLAIN'
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

    it('Can connect using DIGEST-MD5 authentication', function (done) {
      client = new Client({
        jid: jid,
        password: password,
        host: 'localhost',
        preferred: 'DIGEST-MD5'
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

    it('Can connect using ANONYMOUS authentication', function (done) {
      client = new Client({
        jid: '@anon.localhost',
        password: password,
        host: 'localhost',
        preferred: 'ANONYMOUS'
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
  })
})
