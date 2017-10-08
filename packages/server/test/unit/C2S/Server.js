'use strict'

/* global describe, it */

const assert = require('assert')
const Server = require('../../../lib/Server')
const C2SServer = require('../../../lib/C2S/Server')
const C2SSession = require('../../../lib/C2S/Session')

describe('C2S Server', () => {
  it('is an instance of Server', () => {
    const s = new C2SServer()
    assert(s instanceof Server)
  })
  it('has an availableSaslMechanisms array property', () => {
    const s = new C2SServer()
    assert(Array.isArray(s.availableSaslMechanisms))
  })
  it('sets rejectUnauthorized to true if requestCert is true', () => {
    const s = new C2SServer({requestCert: true})
    assert.equal(s.options.rejectUnauthorized, true)
  })
  it('has C2S Session as default session', () => {
    assert.equal(C2SServer.prototype.Session, C2SSession)
  })
})
