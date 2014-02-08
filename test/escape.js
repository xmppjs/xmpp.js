'use strict';

var assert = require('assert'),
    xmpp = require('../index');

describe('Escape', function () {

    describe('space cadet', function() {

        it('escape `space cadet', function () {
            var esc = xmpp.Escape.escapeLocal('space cadet')
            assert.equal(esc, 'space\\20cadet');
        })

        it('unescape `space\\20cadet', function () {
            var unesc = xmpp.Escape.unescapeLocal('space\\20cadet')
            assert.equal(unesc, 'space cadet');
        })

    })

    describe('call me \"ishmael\"', function() {

        it('escape `call me \"ishmael\"`', function () {
            var esc = xmpp.Escape.escapeLocal('call me \"ishmael\"')
            assert.equal(esc, 'call\\20me\\20\\22ishmael\\22');
        })

        it('unescape `call\\20me\\20\\22ishmael\\22`', function () {
            var unesc = xmpp.Escape.unescapeLocal('call\\20me\\20\\22ishmael\\22')
            assert.equal(unesc, 'call me \"ishmael\"');
        })

    })

    describe('at&t guy', function() {

        it('escape `at&t guy`', function () {
            var esc = xmpp.Escape.escapeLocal('at&t guy')
            assert.equal(esc, 'at\\26t\\20guy');
        })

        it('unescape `at\\26t\\20guy`', function () {
            var unesc = xmpp.Escape.unescapeLocal('at\\26t\\20guy')
            assert.equal(unesc, 'at&t guy');
        })

    })
    
    describe('d\'artagnan', function() {

        it('escape `d\'artagnan`', function () {
            var esc = xmpp.Escape.escapeLocal('d\'artagnan')
            assert.equal(esc, 'd\\27artagnan');
        })

        it('unescape `d\\27artagnan`', function () {
            var unesc = xmpp.Escape.unescapeLocal('d\\27artagnan')
            assert.equal(unesc, 'd\'artagnan');
        })

    })

    describe('/.fanboy', function() {

        it('escape `/.fanboy`', function () {
            var esc = xmpp.Escape.escapeLocal('/.fanboy')
            assert.equal(esc, '\\2f.fanboy');
        })

        it('unescape `\\2f.fanboy`', function () {
            var unesc = xmpp.Escape.unescapeLocal('\\2f.fanboy')
            assert.equal(unesc, '/.fanboy');
        })

    })

    describe('::foo::', function() {

        it('escape `::foo::`', function () {
            var esc = xmpp.Escape.escapeLocal('::foo::')
            assert.equal(esc, '\\3a\\3afoo\\3a\\3a');
        })

        it('unescape `\\3a\\3afoo\\3a\\3a`', function () {
            var unesc = xmpp.Escape.unescapeLocal('\\3a\\3afoo\\3a\\3a')
            assert.equal(unesc, '::foo::');
        })

    })

    describe('<foo>', function() {

        it('escape `<foo>`', function () {
            var esc = xmpp.Escape.escapeLocal('<foo>')
            assert.equal(esc, '\\3cfoo\\3e');
        })

        it('unescape `\\3cfoo\\3e`', function () {
            var unesc = xmpp.Escape.unescapeLocal('\\3cfoo\\3e')
            assert.equal(unesc, '<foo>');
        })

    })

    describe('user@host', function() {

        it('escape `user@host`', function () {
            var esc = xmpp.Escape.escapeLocal('user@host')
            assert.equal(esc, 'user\\40host');
        })

        it('unescape `user\\40host`', function () {
            var unesc = xmpp.Escape.unescapeLocal('user\\40host')
            assert.equal(unesc, 'user@host');
        })

    })

    describe('c:\\net', function() {

        it('escape `c:\\net`', function () {
            var esc = xmpp.Escape.escapeLocal('c:\\net')
            assert.equal(esc, 'c\\3a\\5cnet');
        })

        it('unescape `c\\3a\\5cnet`', function () {
            var unesc = xmpp.Escape.unescapeLocal('c\\3a\\5cnet')
            assert.equal(unesc, 'c:\\net');
        })

    })

    describe('c:\\\\net', function() {

        it('escape `c:\\\\net`', function () {
            var esc = xmpp.Escape.escapeLocal('c:\\\\net')
            assert.equal(esc, 'c\\3a\\5c\\5cnet');
        })

        it('unescape `c\\3a\\5c\\5cnet`', function () {
            var unesc = xmpp.Escape.unescapeLocal('c\\3a\\5c\\5cnet')
            assert.equal(unesc, 'c:\\\\net');
        })

    })

    describe('c:\\cool stuff', function() {

        it('escape `c:\\cool stuff`', function () {
            var esc = xmpp.Escape.escapeLocal('c:\\cool stuff')
            assert.equal(esc, 'c\\3a\\5ccool\\20stuff');
        })

        it('unescape `c\\3a\\5ccool\\20stuff`', function () {
            var unesc = xmpp.Escape.unescapeLocal('c\\3a\\5ccool\\20stuff')
            assert.equal(unesc, 'c:\\cool stuff');
        })

    })

    describe('c:\\5commas', function() {

        it('escape `c:\\5commas`', function () {
            var esc = xmpp.Escape.escapeLocal('c:\\5commas')
            assert.equal(esc, 'c\\3a\\5c5commas');
        })

        it('unescape `c\\3a\\5c5commas`', function () {
            var unesc = xmpp.Escape.unescapeLocal('c\\3a\\5c5commas')
            assert.equal(unesc, 'c:\\5commas');
        })

    })

    describe('escaped JID', function() {

        it('use escaped local part with JID', function () {

            var local = 'user@host'
            var jidString = xmpp.Escape.escapeLocal(local) + '@example.com/resource'

            var jid = new xmpp.JID(jidString);
            assert.equal(jid.getLocal(), 'user\\40host');
            assert.equal(jid.getDomain(), 'example.com');
            assert.equal(jid.getResource(), 'resource');
            assert.equal(jid.bare(), 'user\\40host@example.com');

        })

    })
})