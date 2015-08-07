'use strict'

var assert = require('assert')
  , Server = require('../../../lib/Server')
  , C2SServer = require('../../../lib/C2S/Server')
  , C2SSession = require('../../../lib/C2S/Session')

describe('C2S Server', function() {
    it('is an instance of Server', function() {
        var s = new C2SServer()
        assert(s instanceof Server)
    })
    it('has an availableSaslMechanisms array property', function() {
        var s = new C2SServer()
        assert(Array.isArray(s.availableSaslMechanisms))
    })
    it('sets rejectUnauthorized to true if requestCert is true', function() {
        var s = new C2SServer({requestCert: true})
        assert.equal(s.options.rejectUnauthorized, true)
    })
    it('has C2S Session as default session', function() {
        assert.equal(C2SServer.prototype.Session, C2SSession)
    })
})
