'use strict';

var assert = require('assert')
  , xmpp = require('../index')

describe('JID', function() {

    describe('parsing', function() {

        it('should parse a "domain" JID', function() {
            var j = new xmpp.JID('d')
            assert.equal(j.getLocal(), null)
            assert.equal(j.getDomain(), 'd')
            assert.equal(j.getResource(), null)
        })
        it('should parse a "user@domain" JID', function() {
            var j = new xmpp.JID('u@d')
            assert.equal(j.getLocal(), 'u')
            assert.equal(j.getDomain(), 'd')
            assert.equal(j.getResource(), null)
        })
        it('should parse a "domain/resource" JID', function() {
            var j = new xmpp.JID('d/r')
            assert.equal(j.getLocal(), null)
            assert.equal(j.getDomain(), 'd')
            assert.equal(j.getResource(), 'r')
        })
        it('should parse a "user@domain/resource" JID', function() {
            var j = new xmpp.JID('u@d/r')
            assert.equal(j.getLocal(), 'u')
            assert.equal(j.getDomain(), 'd')
            assert.equal(j.getResource(), 'r')
        })
        it('should parse an internationalized domain name as unicode', function() {
            var j = new xmpp.JID('öko.de')
            assert.equal(j.getDomain(), 'öko.de')
        })
        it('should parse an empty domain JID (#109)', function() {
            var j = new xmpp.JID('u@d', '')
            assert.equal(j.getLocal(), 'u')
            assert.equal(j.getDomain(), 'd')
            assert.equal(j.getResource(), null)
        })
        it('should allow access to jid parts using (old) keys', function() {
            var j = new xmpp.JID('u@d/r', '')
            assert.equal(j.user, 'u')
            assert.equal(j.domain, 'd')
            assert.equal(j.resource, 'r')
        })
        it('should allow access to jid parts using (old) keys', function() {
            var j = new xmpp.JID('u@d/r', '')
            assert.equal(j.local, 'u')
            assert.equal(j.domain, 'd')
            assert.equal(j.resource, 'r')
        })

        it('shouldn\'t get U_STRINGPREP_PROHIBITED_ERROR (#93)', function() {
            assert.doesNotThrow(function () {
                var j = new xmpp.JID('f u@d')
            })
        })

        try {
            // HACK: these tests fail if node-stringprep is not used
            require('node-stringprep')

            it('should parse an internationalized domain name as ascii/punycode', function() {
                var j = new xmpp.JID('xn--ko-eka.de')
                assert.equal(j.getDomain(), 'öko.de')
            })

            it('should parse a JID with punycode', function() {
                var j = new xmpp.JID('Сергей@xn--lsa92diaqnge.xn--p1ai')
                assert.equal(j.getLocal(), 'сергей')
                assert.equal(j.getDomain(), 'приме́р.рф')
            })

        } catch (ex) {
            //ignore
        }
    })

    describe('serialization', function() {

        it('should serialize a "domain" JID', function() {
            var j = new xmpp.JID(null, 'd')
            assert.equal(j.toString(), 'd')
        })

        it('should serialize a "user@domain" JID', function() {
            var j = new xmpp.JID('u', 'd')
            assert.equal(j.toString(), 'u@d')
        })

        it('should serialize a "domain/resource" JID', function() {
            var j = new xmpp.JID(null, 'd', 'r')
            assert.equal(j.toString(), 'd/r')
        })

        it('should serialize a "user@domain/resource" JID', function() {
            var j = new xmpp.JID('u', 'd', 'r')
            assert.equal(j.toString(), 'u@d/r')
        })

    })

    describe('equality', function() {

        it('should parsed JIDs should be equal', function() {
            var j1 = new xmpp.JID('foo@bar/baz')
            var j2 = new xmpp.JID('foo@bar/baz')
            assert.equal(j1.equals(j2), true)
        })

        it('should parsed JIDs should be not equal', function() {
            var j1 = new xmpp.JID('foo@bar/baz')
            var j2 = new xmpp.JID('quux@bar/baz')
            assert.equal(j1.equals(j2), false)
        })

        it('should should ignore case in user', function() {
            var j1 = new xmpp.JID('foo@bar/baz')
            var j2 = new xmpp.JID('FOO@bar/baz')
            assert.equal(j1.equals(j2), true)
        })

        it('should should ignore case in domain', function() {
            var j1 = new xmpp.JID('foo@bar/baz')
            var j2 = new xmpp.JID('foo@BAR/baz')
            assert.equal(j1.equals(j2), true)
        })

        it('should should not ignore case in resource', function() {
            var j1 = new xmpp.JID('foo@bar/baz')
            var j2 = new xmpp.JID('foo@bar/Baz')
            assert.equal(j1.equals(j2), false)
        })

        it('should should ignore international caseness', function() {
            var j1 = new xmpp.JID('föö@bär/baß')
            var j2 = new xmpp.JID('fÖö@BÄR/baß')
            assert.equal(j1.equals(j2), true)
        })

    })

})