/* eslint-env mocha */

'use strict'

const OutgoingServer = require('../../../lib/S2S/session/outgoing')
const assert = require('assert')
const Connection = require('@xmpp/connection')
const { parse } = require('ltx')
const sinon = require('sinon')

describe('S2S OutgoingServer', () => {
  let outgoing = null
  const FROM_SERVER = 'nodexmpp.com'
  const TO_SERVER = 'example.com'

  it('is an instance of Connection', () => {
    outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
    assert(outgoing instanceof Connection)
  })

  describe('Stream attributes', () => {
    it('should contain a from', () => {
      outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
      assert(outgoing.streamAttrs)
      assert.equal(outgoing.streamAttrs.from, FROM_SERVER)
    })
  })

  it('should only send one stream header after TLS connect', () => {
    const emptyFn = () => { }
    outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
    const sendStub = sinon.stub(outgoing, 'send')

    outgoing.emit('connect', { on: emptyFn, setKeepAlive: emptyFn })
    outgoing.socket.emit('secure')

    sinon.assert.calledOnce(sendStub)
  })

  describe('onStanza handle correct auth based on features response', () => {
    it('should emit auth external when SASL mechanism is available', () => {
      outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
      const emitStub = sinon.stub(outgoing, 'emit')

      const streamFeaturesResponse = '<stream:features xmlns:db="jabber:server:dialback" xmlns:stream="http://etherx.jabber.org/streams"><dialback xmlns="urn:xmpp:features:dialback"/><mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl"><mechanism>EXTERNAL</mechanism></mechanisms></stream:features>'

      const stanza = parse(streamFeaturesResponse)
      outgoing.onStanza(stanza)
      sinon.assert.calledWithExactly(emitStub, 'auth', 'external')
    })

    it('should emit auth dialback when only dialback is available', () => {
      outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
      const emitStub = sinon.stub(outgoing, 'emit')

      const streamFeaturesResponse = '<stream:features xmlns:db="jabber:server:dialback" xmlns:stream="http://etherx.jabber.org/streams"><dialback xmlns="urn:xmpp:features:dialback"/></stream:features>'

      const stanza = parse(streamFeaturesResponse)
      outgoing.onStanza(stanza)
      sinon.assert.calledWithExactly(emitStub, 'auth', 'dialback')
    })

    it('should emit stanza event when SASL success stanza is received', () => {
      outgoing = new OutgoingServer(FROM_SERVER, TO_SERVER)
      const emitStub = sinon.stub(outgoing, 'emit')

      const success = '<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl"/>'
      const stanza = parse(success)

      outgoing.onStanza(stanza)
      sinon.assert.calledWithExactly(emitStub, 'stanza', stanza)
    })
  })
})
