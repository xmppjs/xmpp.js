/* eslint-env mocha */

'use strict'

var OutgoingServer = require('../../../lib/S2S/session/outgoing')
var assert = require('assert')
var Connection = require('node-xmpp-core').Connection
var ltx = require('node-xmpp-core').ltx
var sinon = require('sinon')

describe('S2S OutgoingServer', function () {
  var outgoing = null
  var FROM_SERVER = 'nodexmpp.com'
  var TO_SERVER = 'example.com'

  it('is an instance of Connection', function () {
    outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
    assert(outgoing instanceof Connection)
  })

  describe('Stream attributes', function () {
    it('should contain a from', function () {
      outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
      assert(outgoing.streamAttrs)
      assert.equal(outgoing.streamAttrs.from, FROM_SERVER)
    })
  })

  it('should only send one stream header after TLS connect', function () {
    var emptyFn = function () {}
    outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
    var sendStub = sinon.stub(outgoing, 'send')

    outgoing.emit('connect', {on: emptyFn, setKeepAlive: emptyFn})
    outgoing.socket.emit('secure')

    sinon.assert.calledOnce(sendStub)
  })

  describe('onStanza handle correct auth based on features response', function () {
    it('should emit auth external when SASL mechanism is available', function () {
      outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
      var emitStub = sinon.stub(outgoing, 'emit')

      var streamFeaturesResponse = '<stream:features xmlns:db="jabber:server:dialback" xmlns:stream="http://etherx.jabber.org/streams"><dialback xmlns="urn:xmpp:features:dialback"/><mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl"><mechanism>EXTERNAL</mechanism></mechanisms></stream:features>'

      var stanza = ltx.parse(streamFeaturesResponse)
      outgoing.onStanza(stanza)
      sinon.assert.calledWithExactly(emitStub, 'auth', 'external')
    })

    it('should emit auth dialback when only dialback is available', function () {
      outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
      var emitStub = sinon.stub(outgoing, 'emit')

      var streamFeaturesResponse = '<stream:features xmlns:db="jabber:server:dialback" xmlns:stream="http://etherx.jabber.org/streams"><dialback xmlns="urn:xmpp:features:dialback"/></stream:features>'

      var stanza = ltx.parse(streamFeaturesResponse)
      outgoing.onStanza(stanza)
      sinon.assert.calledWithExactly(emitStub, 'auth', 'dialback')
    })

    it('should emit stanza event when SASL success stanza is received', function () {
      outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
      var emitStub = sinon.stub(outgoing, 'emit')

      var success = '<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl"/>'
      var stanza = ltx.parse(success)

      outgoing.onStanza(stanza)
      sinon.assert.calledWithExactly(emitStub, 'stanza', stanza)
    })
  })
})
