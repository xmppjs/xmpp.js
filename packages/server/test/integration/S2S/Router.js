/* eslint-env mocha */

'use strict'

const Router = require('../../../lib/S2S/Router')
const assert = require('assert')
const sinon = require('sinon')
const parse = require('node-xmpp-core').ltx.parse
const async = require('async')
const dns = require('dns')
const fs = require('fs')
const path = require('path')

describe('S2S Router Integration', () => {
  let exampleRouter, nodeXmppRouter, certs

  const msgToExampleStr = '<message to="test-user@example.com" from="xiaoxin.lu@nodexmpp.com" type="chat" xml:lang="en"><body>Hi. This is a test message.</body></message>'
  const msgToExampleStanza = parse(msgToExampleStr)

  const msgToNodeXmppStr = '<message to="xiaoxin.lu@nodexmpp.com" from="test-user@example.com" type="chat" xml:lang="en"><body>Hello. This is my message.</body></message>'
  const msgToNodeXmppStanza = parse(msgToNodeXmppStr)

  before(() => {
    sinon.stub(dns, 'resolveSrv')
      .withArgs('_xmpp-server._tcp.nodexmpp.com').yields(null, [{
        priority: 10,
        weight: 5,
        port: 5271,
        name: 'localhost',
      }])
      .withArgs('_xmpp-server._tcp.example.com').yields(null, [{
        priority: 10,
        weight: 5,
        port: 5272,
        name: 'localhost',
      }])

    certs = {
      'example.com': getCreds('example.com'),
      'nodexmpp.com': getCreds('nodexmpp.com'),
    }
  })

  function getCreds (domain) {
    const certRelativeLocation = '../../resources/certs/'
    const key = fs.readFileSync(path.join(__dirname, certRelativeLocation, `${domain}.key`), 'ascii')
    const cert = fs.readFileSync(path.join(__dirname, certRelativeLocation, `${domain}.crt`), 'ascii')
    const ca = fs.readFileSync(path.join(__dirname, certRelativeLocation, 'ca.crt'), 'ascii')
    return [domain, key, cert, ca]
  }

  after(() => {
    dns.resolveSrv.restore()
  })

  function close (done) {
    async.each([exampleRouter, nodeXmppRouter], (router, callback) => {
      router.close(callback)
    }, done)
  }

  function unregister () {
    exampleRouter.unregister('example.com')
    nodeXmppRouter.unregister('nodexmpp.com')
  }

  beforeEach(() => {
    exampleRouter = new Router(5272, 'localhost')
    nodeXmppRouter = new Router(5271, 'localhost')
  })

  afterEach((done) => {
    unregister()
    close(done)
  })

  function registerDomainsAndAssert (done) {
    async.parallel({
      example (callback) {
        exampleRouter.register('example.com', (stanza) => {
          callback(null, stanza)
        })
      },
      nodexmpp (callback) {
        nodeXmppRouter.register('nodexmpp.com', (stanza) => {
          callback(null, stanza)
        })
      },
    }, (error, result) => {
      assert(result.example.toString(), msgToExampleStr)
      assert(result.nodexmpp.toString(), msgToNodeXmppStr)
      done(error)
    })

    exampleRouter.send(msgToNodeXmppStanza)
    nodeXmppRouter.send(msgToExampleStanza)
  }

  it('should authenticate outgoing and incoming using dialback', registerDomainsAndAssert)

  it('should authenticate outgoing and incoming using dialback over TLS', (done) => {
    exampleRouter.loadCredentials(...certs['example.com'])
    nodeXmppRouter.loadCredentials(...certs['nodexmpp.com'])
    registerDomainsAndAssert(done)
  })

  it('should authenticate outgoing and incoming using SASL EXTERNAL', (done) => {
    exampleRouter.loadCredentials(...certs['example.com'])
    exampleRouter.addSecureDomain('example.com')

    nodeXmppRouter.loadCredentials(...certs['nodexmpp.com'])
    nodeXmppRouter.addSecureDomain('nodexmpp.com')

    registerDomainsAndAssert(done)
  })
})
