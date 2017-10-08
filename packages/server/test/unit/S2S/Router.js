/* eslint-env mocha */

'use strict'

const Router = require('../../../lib/S2S/Router')
const assert = require('assert')
const sinon = require('sinon')

describe('S2S Router', () => {
  const fakeSocket = {
    on: sinon.stub().returnsThis(),
    once: sinon.stub().returnsThis(),
    emit: sinon.stub().returnsThis(),
    end: sinon.stub(),
    setKeepAlive: sinon.stub(),
  }

  describe('constructor', () => {
    it('sets up secure domains using passed in as opts.secureDomains', () => {
      const router = new Router(5269, 'localhost', {
        secureDomains: ['nodexmpp.com', 'example.com'],
      })

      assert.equal(router.getContext('nodexmpp.com').secureDomain, true)
      assert.equal(router.getContext('example.com').secureDomain, true)
      assert.equal(router.getContext('someotherdomain.com').secureDomain, undefined)
    })
  })

  describe('Incoming Server authed', () => {
    it('should call onSASLAuth when auth event is received with SASL type', () => {
      const router = new Router()
      const stream = router.acceptConnection(fakeSocket)
      const onAuthStub = sinon.stub(stream, 'onSASLAuth')
      stream.emit('auth', 'SASL')
      sinon.assert.calledOnce(onAuthStub)
    })

    it('should not call onSASLAuth when auth event is received without SASL type', () => {
      const router = new Router()
      const stream = router.acceptConnection(fakeSocket)
      const onAuthStub = sinon.stub(stream, 'onSASLAuth')
      stream.emit('auth')
      sinon.assert.notCalled(onAuthStub)
    })

    it('should calls domainContext addInStream method for the stream when authenticated', () => {
      const router = new Router()
      const stream = router.acceptConnection(fakeSocket)

      stream.fromDomain = 'example.com'
      stream.toDomain = 'nodexmpp.com'

      const addInStream = sinon.stub()
      const getContextStub = sinon.stub(router, 'getContext').returns({
        addInStream,
      })

      stream.emit('auth', 'SASL')

      sinon.assert.calledWithExactly(getContextStub, 'nodexmpp.com')
      sinon.assert.calledWithExactly(addInStream, 'example.com', stream)
    })
  })

  describe('Incoming Server sendFeatures', () => {
    const attrs = {'xmlns:db': 'jabber:server:dialback',
      'xmlns:stream': 'http://etherx.jabber.org/streams',
      'xml:lang': 'en',
      'from': 'example.com',
      'to': 'nodexmpp.com',
      'version': '1.0',
      'xmlns': 'jabber:server'}

    it('should not offer TLS to incoming connections without credentials', () => {
      const router = new Router()
      const stream = router.acceptConnection(fakeSocket)

      const sendSpy = sinon.spy(stream, 'send')
      const sendFeaturesSpy = sinon.spy(stream, 'sendFeatures')

      stream.emit('streamStart', attrs)

      assert.equal(stream.opts.tls, undefined)
      assert.equal(stream.fromDomain, attrs.from)
      assert.equal(stream.toDomain, attrs.to)
      assert(sendFeaturesSpy.calledOnce)
      sinon.assert.calledWith(sendSpy, sinon.match((features) => {
        return features.getChild('starttls', stream.NS_XMPP_TLS) === undefined
      }))
    })

    it('should offer TLS to incoming connections with credentials', () => {
      const router = new Router()
      const credentials = {key: 'key', cert: 'cert'}
      router.getContext('nodexmpp.com').credentials = credentials

      const stream = router.acceptConnection(fakeSocket)

      const sendSpy = sinon.spy(stream, 'send')
      const sendFeaturesSpy = sinon.spy(stream, 'sendFeatures')

      stream.emit('streamStart', attrs)

      assert.equal(stream.opts.tls, true)
      assert.equal(stream.credentials, credentials)
      assert.equal(stream.fromDomain, attrs.from)
      assert.equal(stream.toDomain, attrs.to)
      assert(sendFeaturesSpy.calledOnce)
      sinon.assert.calledWith(sendSpy, sinon.match((features) => {
        return Boolean(features.getChild('starttls', stream.NS_XMPP_TLS))
      }))
    })
  })
})
