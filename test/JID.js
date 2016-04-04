/* global describe, it */

'use strict'

var assert = require('assert')
var JID = require('..').JID

describe('JID', function () {
  describe('parsing', function () {
    it('should parse a "domain" JID', function () {
      var j = new JID('d')
      assert.equal(j.getLocal(), null)
      assert.equal(j.getUser(), null) // DEPRECATED
      assert.equal(j.getDomain(), 'd')
      assert.equal(j.getResource(), null)
    })

    it('should parse a "user@domain" JID', function () {
      var j = new JID('u@d')
      assert.equal(j.getLocal(), 'u')
      assert.equal(j.getUser(), 'u') // DEPRECATED
      assert.equal(j.getDomain(), 'd')
      assert.equal(j.getResource(), null)
    })

    it('should parse a "domain/resource" JID', function () {
      var j = new JID('d/r')
      assert.equal(j.getLocal(), null)
      assert.equal(j.getUser(), null) // DEPRECATED
      assert.equal(j.getDomain(), 'd')
      assert.equal(j.getResource(), 'r')
    })

    it('should parse a "user@domain/resource" JID', function () {
      var j = new JID('u@d/r')
      assert.equal(j.getLocal(), 'u')
      assert.equal(j.getUser(), 'u') // DEPRECATED
      assert.equal(j.getDomain(), 'd')
      assert.equal(j.getResource(), 'r')
    })

    it('should parse a "user@domain/resource@thing" JID', function () {
      var j = new JID('u@d/r@foo')
      assert.equal(j.getLocal(), 'u')
      assert.equal(j.getUser(), 'u') // DEPRECATED
      assert.equal(j.getDomain(), 'd')
      assert.equal(j.getResource(), 'r@foo')
    })

    it('should parse a "user@domain/resource/thing" JID', function () {
      var j = new JID('u@d/r/foo')
      assert.equal(j.getLocal(), 'u')
      assert.equal(j.getUser(), 'u') // DEPRECATED
      assert.equal(j.getDomain(), 'd')
      assert.equal(j.getResource(), 'r/foo')
    })

    it('should parse an internationalized domain name as unicode', function () {
      var j = new JID('öko.de')
      assert.equal(j.getDomain(), 'öko.de')
    })

    it('should parse an empty domain JID (#109)', function () {
      var j = new JID('u@d', '')
      assert.equal(j.getLocal(), 'u')
      assert.equal(j.getUser(), 'u') // DEPRECATED
      assert.equal(j.getDomain(), 'd')
      assert.equal(j.getResource(), null)
    })

    it('should allow access to jid parts using keys', function () {
      var j = new JID('u@d/r', '')
      assert.equal(j.local, 'u')
      assert.equal(j.user, 'u') // DEPRECATED
      assert.equal(j.domain, 'd')
      assert.equal(j.resource, 'r')
    })

    it('shouldn\'t get U_STRINGPREP_PROHIBITED_ERROR (#93)', function () {
      assert.doesNotThrow(function () {
        var j = new JID('f u@d')
        j.toString()
      })
    })
  })

  describe('Escaping', function () {
    it('Should not change string - issue 43', function () {
      var test = 'test\u001a@example.com'

      var jid = new JID(test)
      assert.equal(jid.escapeLocal('test\u001a'), 'test\u001a')
    })

    it('Should escape - issue 43', function () {
      var test = 'test\u001aa@example.com'

      var jid = new JID(test)
      assert.equal(jid.escapeLocal('test\u001aa'), 'testa')
    })
  })

  describe('serialization', function () {
    it('should serialize a "domain" JID', function () {
      var j = new JID(null, 'd')
      assert.equal(j.toString(), 'd')
    })

    it('should serialize a "user@domain" JID', function () {
      var j = new JID('u', 'd')
      assert.equal(j.toString(), 'u@d')
    })

    it('should serialize a "domain/resource" JID', function () {
      var j = new JID(null, 'd', 'r')
      assert.equal(j.toString(), 'd/r')
    })

    it('should serialize a "user@domain/resource" JID', function () {
      var j = new JID('u', 'd', 'r')
      assert.equal(j.toString(), 'u@d/r')
    })
  })

  describe('equality', function () {
    it('should parsed JIDs should be equal', function () {
      var j1 = new JID('foo@bar/baz')
      var j2 = new JID('foo@bar/baz')
      assert.equal(j1.equals(j2), true)
    })

    it('should parsed JIDs should be not equal', function () {
      var j1 = new JID('foo@bar/baz')
      var j2 = new JID('quux@bar/baz')
      assert.equal(j1.equals(j2), false)
    })

    it('should ignore case in user', function () {
      var j1 = new JID('foo@bar/baz')
      var j2 = new JID('FOO@bar/baz')
      assert.equal(j1.equals(j2), true)
    })

    it('should ignore case in domain', function () {
      var j1 = new JID('foo@bar/baz')
      var j2 = new JID('foo@BAR/baz')
      assert.equal(j1.equals(j2), true)
    })

    it('should not ignore case in resource', function () {
      var j1 = new JID('foo@bar/baz')
      var j2 = new JID('foo@bar/Baz')
      assert.equal(j1.equals(j2), false)
    })

    it('should ignore international caseness', function () {
      var j1 = new JID('föö@bär/baß')
      var j2 = new JID('fÖö@BÄR/baß')
      assert.equal(j1.equals(j2), true)
    })

    it('should work with bare JIDs', function () {
      var j1 = new JID('romeo@example.net/9519407536580081')
      var j2 = new JID('romeo@example.net')
      assert.equal(j1.bare().equals(j2), true)
    })
  })
})
