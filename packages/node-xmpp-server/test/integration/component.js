'use strict'

/* global describe, before, after, it */

var assert = require('assert')
var XMPP = require('../..')
var Server = XMPP.component.Server
var Component = require('node-xmpp-component')

var server = new Server({
  autostart: false,
  port: 5343
})
server.on('connection', function (connection) {
  connection.on('verify-component', function (jid, cb) {
    switch (jid.toString()) {
      case 'foo.localhost':
        return cb(null, 'password')
      default:
        return cb(new Error('unknown host'))
    }
  })

  connection.on('stanza', function (stanza) {
    stanza.attrs.from = server.jid
    stanza.attrs.to = connection.jid
    connection.send(stanza)
  })
  connection.on('error', function () {})
})

describe('component server - component', function () {
  describe('server', function () {
    it('should listen', function (done) {
      server.listen(done)
    })
  })

  describe('component', function () {
    it('should connect', function (done) {
      var component = new Component({
        jid: 'foo.localhost',
        password: 'password',
        host: 'localhost',
        port: 5343
      })
      component.on('error', done)
      component.on('online', done)
    })
  })

  describe('component not serviced by server', function () {
    it('should connect', function (done) {
      var component = new Component({
        jid: 'unknown.localhost',
        password: 'password',
        host: 'localhost',
        port: 5343
      })
      component.on('error', done)
      component.on('disconnect', function (err) {
        assert.equal(err.message, 'unknown host')
        assert.equal(err.stanza.children[0].name, 'host-unknown')
        done()
      })
    })
  })

  describe('component supplied invalid credentials', function () {
    it('should connect', function (done) {
      var component = new Component({
        jid: 'foo.localhost',
        password: 'notthepassword',
        host: 'localhost',
        port: 5343
      })
      component.on('error', done)
      component.on('disconnect', function (err) {
        assert.equal(err.message, 'not authorized')
        assert.equal(err.stanza.children[0].name, 'not-authorized')
        done()
      })
    })
  })

  describe('component that uses wrong namespace', function () {
    var NS_COMPONENT = Component.prototype.NS_COMPONENT

    before(function () {
      Component.prototype.NS_COMPONENT = 'jabber:component:wrong'
    })

    after(function () {
      Component.prototype.NS_COMPONENT = NS_COMPONENT
    })

    it('should error if wrong namespace', function (done) {
      var component = new Component({
        jid: 'foo.localhost',
        password: 'password',
        host: 'localhost',
        port: 5343
      })
      component.on('error', done)
      component.on('disconnect', function (err) {
        assert.equal(err.message, "invalid namespace 'jabber:component:wrong'")
        assert.equal(err.stanza.children[0].name, 'invalid-namespace')
        done()
      })
    })
  })
})
