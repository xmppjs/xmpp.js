/* global describe, it */

'use strict'

var assert = require('assert')
var stanza = require('..')
var Element = stanza.Element
var Stanza = stanza.Stanza
var IQ = stanza.IQ
var Presence = stanza.Presence
var Message = stanza.Message

describe('Stanza', function () {
  it('is an instance of Element', function () {
    var s = new Stanza('foobar')
    assert(s instanceof Stanza)
    assert(s instanceof Element)
  })

  describe('create', function () {
    describe('IQ', function () {
      it('should return an iq stanza', function () {
        var s = new Stanza('iq')
        assert(s instanceof Stanza)
        assert(s.is('iq'))
      })

      it('should return an iq stanza', function () {
        var s = new IQ()
        assert(s instanceof Stanza)
        assert(s.is('iq'))
      })
    })

    describe('message', function () {
      it('should return a message stanza', function () {
        var s = new Stanza('message')
        assert(s instanceof Stanza)
        assert(s.is('message'))
      })

      it('should return a message stanza', function () {
        var s = new Message()
        assert(s instanceof Stanza)
        assert(s.is('message'))
      })
    })

    describe('presence', function () {
      it('should return a presence stanza', function () {
        var s = new Stanza('presence')
        assert(s instanceof Stanza)
        assert(s.is('presence'))
      })

      it('should return a presence stanza', function () {
        var s = new Presence()
        assert(s instanceof Stanza)
        assert(s.is('presence'))
      })
    })
  })

  describe('common attributes as properties', function () {
    var s = new Stanza('iq')

    describe('from', function () {
      it('should set "from" attribute', function () {
        s.from = 'l@d'
        assert.equal(s.attrs.from, 'l@d')
      })

      it('should get "from" attribute', function () {
        s.attrs.from = 'd@l'
        assert.equal(s.from, 'd@l')
      })
    })

    describe('to', function () {
      it('should set "to" attribute', function () {
        s.to = 'l@d'
        assert.equal(s.attrs.to, 'l@d')
      })

      it('should get "to" attribute', function () {
        s.attrs.to = 'd@l'
        assert.equal(s.to, 'd@l')
      })
    })

    describe('id', function () {
      it('should set "id" attribute', function () {
        s.id = 'i'
        assert.equal(s.attrs.id, 'i')
      })

      it('should get "id" attribute', function () {
        s.attrs.id = 'd'
        assert.equal(s.id, 'd')
      })
    })

    describe('type', function () {
      it('should set "type" attribute', function () {
        s.type = 'error'
        assert.equal(s.attrs.type, 'error')
      })

      it('should get "type" attribute', function () {
        s.attrs.type = 'result'
        assert.equal(s.type, 'result')
      })
    })
  })

  describe('clone', function () {
    var originalStanza = new Stanza('iq')
      .c('foo', { xmlns: 'bar' }).up()
      .c('bar', { xmlns: 'foo' }).root()

    it('clones the stanza', function () {
      var cloned = originalStanza.clone()
      assert.equal(originalStanza.toString(), cloned.toString())
      assert(originalStanza.equals(cloned))
    })

    it('returns a Stanza instance', function () {
      var cloned = originalStanza.clone()
      assert(cloned instanceof Stanza)
    })

    it('uses the correct constructor for children', function () {
      var cloned = originalStanza.clone()
      assert(cloned.children[0] instanceof Element)
    })

    it("doesn't modify clone if original is modified", function () {
      var cloned = originalStanza.clone()
      originalStanza.attr('foo', 'bar')
      assert.equal(cloned.attr('foo'), undefined)
      originalStanza.c('foobar')
      assert.equal(cloned.getChild('foobar'), undefined)
    })
  })
})
