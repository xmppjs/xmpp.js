'use strict'

/* global describe, it, beforeEach, afterEach */

var Component = require('../../packages/node-xmpp-component')
var Stanza = require('../../packages/node-xmpp-core').Stanza
var Client = require('../../packages/node-xmpp-client')
var helper = require('../helper')

require('should')

var component = null
var client = null
var user = null

var options = {}

var connectClients = function (done) {
  component = new Component(options)
  component.on('online', function () {
    var options = {
      jid: user + '@localhost',
      password: 'password',
      host: '127.0.0.1',
      register: true
    }
    client = new Client(options)
    client.on('online', function () {
      client.send(new Stanza('presence'))
      done()
    })
    client.on('error', function (error) {
      done(error)
    })
  })
}

describe('Component', function () {
  beforeEach(function (done) {
    options = {
      jid: 'component.localhost',
      password: 'mysecretcomponentpassword',
      host: 'localhost',
      port: 5347
    }
    user = (+new Date()).toString(36)
    helper.startServer(function () {
      connectClients(done)
    })
  })

  afterEach(function () {
    if (client) client.end()
    if (component) component.end()
    component = null
    client = null
  })

  it('Can connect and send a message', function (done) {
    client.on('stanza', function (stanza) {
      if (stanza.is('message') === false) return
      stanza.is('message').should.be.true
      stanza.attrs.from.should.equal('component.localhost')
      stanza.attrs.to.should.equal(user + '@localhost')
      stanza.attrs.type.should.equal('chat')
      stanza.getChildText('body').should.equal('Hello little miss client!')
      done()
    })
    var outgoing = new Stanza('message', {
      to: user + '@localhost',
      type: 'chat',
      from: 'component.localhost'
    })
    outgoing.c('body').t('Hello little miss client!')
    component.send(outgoing)
  })

  it('Can receive a message', function (done) {
    component.on('stanza', function (stanza) {
      if (!stanza.is('message')) return
      stanza.is('message').should.be.true
      stanza.attrs.to.should.equal('component.localhost')
      stanza.attrs.from.should.startWith(user + '@localhost')
      stanza.attrs.type.should.equal('chat')
      stanza.getChildText('body').should.equal('Hello mr component!')
      done()
    })
    var outgoing = new Stanza('message', {
      from: user + '@localhost',
      type: 'chat',
      to: 'component.localhost'
    })
    outgoing.c('body').t('Hello mr component!')
    client.send(outgoing)
  })

  it('Errors if connecting with bad authentication information', function (done) {
    component.end()
    component = null
    options.password = 'incorrect'
    component = new Component(options)
    component.on('close', function () {
      done()
    })
    component.on('online', function () {
      done('Should not connect')
    })
  })

  it('Sends error when server stops', function (done) {
    client.end()
    component.on('error', function () {
      done()
    })
    component.on('close', function () {
      done()
    })
    helper.stopServer()
  })
})
