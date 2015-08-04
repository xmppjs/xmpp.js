'use strict';

var assert = require('assert')
  , stanza = require('../index').Stanza

describe('Stanza', function() {

    describe('create', function() {

        describe('iq', function() {

            it('should return an iq stanza', function() {
                var s = new stanza.Stanza('iq');
                assert(s instanceof stanza.Stanza);
                assert(s.is('iq'));
            })

            it('should return an iq stanza', function() {
                var s = new stanza.Iq();
                assert(s instanceof stanza.Stanza);
                assert(s.is('iq'));
            })

        })

        describe('message', function() {

            it('should return a message stanza', function() {
                var s = new stanza.Stanza('message');
                assert(s instanceof stanza.Stanza);
                assert(s.is('message'));
            })

            it('should return an iq stanza', function() {
                var s = new stanza.Message();
                assert(s instanceof stanza.Stanza);
                assert(s.is('message'));
            })

        })

        describe('presence', function() {

            it('should return a presence stanza', function() {
                var s = new stanza.Stanza('presence');
                assert(s instanceof stanza.Stanza);
                assert(s.is('presence'));
            })

            it('should return a presence stanza', function() {
                var s = new stanza.Presence();
                assert(s instanceof stanza.Stanza);
                assert(s.is('presence'));
            })

        })

    })

    describe('common attributes as properties', function() {

        var s = new stanza.Stanza('iq');

        describe('from', function() {

            it('should set "from" attribute', function() {
                s.from = 'l@d';
                assert.equal(s.attrs.from, 'l@d');
            })

            it('should get "from" attribute', function() {
                s.attrs.from = 'd@l';
                assert.equal(s.from, 'd@l');
            })

        })

        describe('to', function() {

            it('should set "to" attribute', function() {
                s.to = 'l@d';
                assert.equal(s.attrs.to, 'l@d');
            })

            it('should get "from" attribute', function() {
                s.attrs.to = 'd@l';
                assert.equal(s.to, 'd@l');
            })

        })

        describe('id', function() {

            it('should set "id" attribute', function() {
                s.id = 'i';
                assert.equal(s.attrs.id, 'i');
            })

            it('should get "id" attribute', function() {
                s.attrs.id = 'd';
                assert.equal(s.id, 'd');
            })

        })

        describe('type', function() {

            it('should set "type" attribute', function() {
                s.type = 'error';
                assert.equal(s.attrs.type, 'error');
            })

            it('should get "type" attribute', function() {
                s.attrs.type = 'result';
                assert.equal(s.type, 'result');
            })

        })

    })

    describe('clone', function() {

        var originalStanza = new stanza.Stanza('iq')
            .c('foo', { xmlns: 'bar' })
            .up()
            .c('bar', { xmlns: 'foo' })
            .root()

        it('clones the stanza', function() {
            var cloned = originalStanza.clone()
            assert.equal(originalStanza.toString(), cloned.toString())
        })

        it('returns a Stanza instance', function() {
            var cloned = originalStanza.clone()
            assert(cloned instanceof stanza.Stanza)
        })

        it('doesn\'t modify clone if original is modified', function() {
            var cloned = originalStanza.clone()
            originalStanza.attr('foo', 'bar')
            assert.equal(cloned.attr('foo'), undefined)
            originalStanza.c('foobar')
            assert.equal(cloned.getChild('foobar'), undefined)
        })
    })

})
