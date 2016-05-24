/* eslint-env mocha */

'use strict'

var Router = require('../../../lib/S2S/Router')
var assert = require('assert')
var sinon = require('sinon')

describe('S2S Router', function () {
  describe('constructor', function () {
    it('sets up secure domains using passed in as opts.secureDomains', function () {
      var router = new Router(5269, 'localhost', {
        secureDomains: ['nodexmpp.com', 'example.com']
      })

      assert.equal(router.getContext('nodexmpp.com').secureDomain, true)
      assert.equal(router.getContext('example.com').secureDomain, true)
      assert.equal(router.getContext('someotherdomain.com').secureDomain, undefined)
    })
  })

  describe('Incoming Server sendFeatures', function () {
    var attrs = {'xmlns:db': 'jabber:server:dialback',
    'xmlns:stream': 'http://etherx.jabber.org/streams',
    'xml:lang': 'en',
    'from': 'example.com',
    'to': 'nodexmpp.com',
    'version': '1.0',
    'xmlns': 'jabber:server'}

    var fakeSocket = {
      on: sinon.stub().returnsThis(),
      once: sinon.stub().returnsThis(),
      emit: sinon.stub().returnsThis(),
      end: sinon.stub(),
      setKeepAlive: sinon.stub()
    }

    it('should not offer TLS to incoming connections without credentials', function () {
      var router = new Router()
      var stream = router.acceptConnection(fakeSocket)

      var sendSpy = sinon.spy(stream, 'send')
      var sendFeaturesSpy = sinon.spy(stream, 'sendFeatures')

      stream.emit('streamStart', attrs)

      assert.equal(stream.opts.tls, undefined)
      assert.equal(stream.fromDomain, attrs.from)
      assert.equal(stream.toDomain, attrs.to)
      assert(sendFeaturesSpy.calledOnce)
      sinon.assert.calledWith(sendSpy, sinon.match(function (features) {
        return features.getChild('starttls', stream.NS_XMPP_TLS) === undefined
      }))
    })

    it('should offer TLS to incoming connections with credentials', function () {
      var router = new Router()
      var credentials = {key: 'key', cert: 'cert'}
      router.getContext('nodexmpp.com').credentials = credentials

      var stream = router.acceptConnection(fakeSocket)

      var sendSpy = sinon.spy(stream, 'send')
      var sendFeaturesSpy = sinon.spy(stream, 'sendFeatures')

      stream.emit('streamStart', attrs)

      assert.equal(stream.opts.tls, true)
      assert.equal(stream.credentials, credentials)
      assert.equal(stream.fromDomain, attrs.from)
      assert.equal(stream.toDomain, attrs.to)
      assert(sendFeaturesSpy.calledOnce)
      sinon.assert.calledWith(sendSpy, sinon.match(function (features) {
        return !!features.getChild('starttls', stream.NS_XMPP_TLS)
      }))
    })
  })
})
