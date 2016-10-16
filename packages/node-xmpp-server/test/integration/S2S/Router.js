/* eslint-env mocha */

'use strict'

var Router = require('../../../lib/S2S/Router')
var assert = require('assert')
var sinon = require('sinon')
var parse = require('node-xmpp-core').ltx.parse
var async = require('async')
var dns = require('dns')
var fs = require('fs')
var path = require('path')

describe('S2S Router Integration', function () {
  var exampleRouter, nodeXmppRouter, certs

  var msgToExampleStr = '<message to="test-user@example.com" from="xiaoxin.lu@nodexmpp.com" type="chat" xml:lang="en"><body>Hi. This is a test message.</body></message>'
  var msgToExampleStanza = parse(msgToExampleStr)

  var msgToNodeXmppStr = '<message to="xiaoxin.lu@nodexmpp.com" from="test-user@example.com" type="chat" xml:lang="en"><body>Hello. This is my message.</body></message>'
  var msgToNodeXmppStanza = parse(msgToNodeXmppStr)

  before(function () {
    sinon.stub(dns, 'resolveSrv')
      .withArgs('_xmpp-server._tcp.nodexmpp.com').yields(null, [{
        priority: 10,
        weight: 5,
        port: 5271,
        name: 'localhost'
      }])
      .withArgs('_xmpp-server._tcp.example.com').yields(null, [{
        priority: 10,
        weight: 5,
        port: 5272,
        name: 'localhost'
      }])

    certs = {
      'example.com': getCreds('example.com'),
      'nodexmpp.com': getCreds('nodexmpp.com')
    }
  })

  function getCreds (domain) {
    var certRelativeLocation = '../../resources/certs/'
    var key = fs.readFileSync(path.join(__dirname, certRelativeLocation, domain + '.key'), 'ascii')
    var cert = fs.readFileSync(path.join(__dirname, certRelativeLocation, domain + '.crt'), 'ascii')
    var ca = fs.readFileSync(path.join(__dirname, certRelativeLocation, 'ca.crt'), 'ascii')
    return [domain, key, cert, ca]
  }

  after(function () {
    dns.resolveSrv.restore()
  })

  function close (done) {
    async.each([exampleRouter, nodeXmppRouter], function (router, callback) {
      router.close(callback)
    }, done)
  }

  function unregister () {
    exampleRouter.unregister('example.com')
    nodeXmppRouter.unregister('nodexmpp.com')
  }

  beforeEach(function () {
    exampleRouter = new Router(5272, 'localhost')
    nodeXmppRouter = new Router(5271, 'localhost')
  })

  afterEach(function (done) {
    unregister()
    close(done)
  })

  function registerDomainsAndAssert (done) {
    async.parallel({
      example: function (callback) {
        exampleRouter.register('example.com', function (stanza) {
          callback(null, stanza)
        })
      },
      nodexmpp: function (callback) {
        nodeXmppRouter.register('nodexmpp.com', function (stanza) {
          callback(null, stanza)
        })
      }
    }, function (error, result) {
      assert(result.example.toString(), msgToExampleStr)
      assert(result.nodexmpp.toString(), msgToNodeXmppStr)
      done(error)
    })

    exampleRouter.send(msgToNodeXmppStanza)
    nodeXmppRouter.send(msgToExampleStanza)
  }

  it('should authenticate outgoing and incoming using dialback', registerDomainsAndAssert)

  it('should authenticate outgoing and incoming using dialback over TLS', function (done) {
    exampleRouter.loadCredentials.apply(exampleRouter, certs['example.com'])
    nodeXmppRouter.loadCredentials.apply(nodeXmppRouter, certs['nodexmpp.com'])
    registerDomainsAndAssert(done)
  })

  it('should authenticate outgoing and incoming using SASL EXTERNAL', function (done) {
    exampleRouter.loadCredentials.apply(exampleRouter, certs['example.com'])
    exampleRouter.addSecureDomain('example.com')

    nodeXmppRouter.loadCredentials.apply(nodeXmppRouter, certs['nodexmpp.com'])
    nodeXmppRouter.addSecureDomain('nodexmpp.com')

    registerDomainsAndAssert(done)
  })
})
