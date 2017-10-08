'use strict'

/* global describe, before, after, it */

const assert = require('assert')
const XMPP = require('../..')
const { Server } = XMPP.component
const Component = require('@xmpp/component')

const server = new Server({
  autostart: false,
  port: 5343,
})
server.on('connection', (connection) => {
  connection.on('verify-component', (jid, cb) => {
    switch (jid.toString()) {
      case 'foo.localhost':
        return cb(null, 'password')
      default:
        return cb(new Error('unknown host'))
    }
  })

  connection.on('stanza', (stanza) => {
    stanza.attrs.from = server.jid
    stanza.attrs.to = connection.jid
    connection.send(stanza)
  })
  connection.on('error', () => { })
})

describe('component server - component', () => {
  describe('server', () => {
    it('should listen', (done) => {
      server.listen(done)
    })
  })

  describe('component', () => {
    it('should connect', (done) => {
      const component = new Component({
        jid: 'foo.localhost',
        password: 'password',
        host: 'localhost',
        port: 5343,
      })
      component.on('error', done)
      component.on('online', done)
    })
  })

  describe('component not serviced by server', () => {
    it('should connect', (done) => {
      const component = new Component({
        jid: 'unknown.localhost',
        password: 'password',
        host: 'localhost',
        port: 5343,
      })
      component.on('error', done)
      component.on('disconnect', (err) => {
        assert.equal(err.message, 'unknown host')
        assert.equal(err.stanza.children[0].name, 'host-unknown')
        done()
      })
    })
  })

  describe('component supplied invalid credentials', () => {
    it('should connect', (done) => {
      const component = new Component({
        jid: 'foo.localhost',
        password: 'notthepassword',
        host: 'localhost',
        port: 5343,
      })
      component.on('error', done)
      component.on('disconnect', (err) => {
        assert.equal(err.message, 'not authorized')
        assert.equal(err.stanza.children[0].name, 'not-authorized')
        done()
      })
    })
  })

  describe('component that uses wrong namespace', () => {
    // eslint-disable-next-line prefer-destructuring
    const NS_COMPONENT = Component.prototype.NS_COMPONENT

    before(() => {
      Component.prototype.NS_COMPONENT = 'jabber:component:wrong'
    })

    after(() => {
      Component.prototype.NS_COMPONENT = NS_COMPONENT
    })

    it('should error if wrong namespace', (done) => {
      const component = new Component({
        jid: 'foo.localhost',
        password: 'password',
        host: 'localhost',
        port: 5343,
      })
      component.on('error', done)
      component.on('disconnect', (err) => {
        assert.equal(err.message, "invalid namespace 'jabber:component:wrong'")
        assert.equal(err.stanza.children[0].name, 'invalid-namespace')
        done()
      })
    })
  })
})
