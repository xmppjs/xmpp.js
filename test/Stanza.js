/* global describe, it */

'use strict'

var assert = require('assert')
var core = require('..')
var Element = core.Element
var Stanza = core.Stanza
var IQ = core.IQ
var Presence = core.Presence
var Message = core.Message
var JID = core.JID

describe('Stanza', function () {
  describe('createStanza', function () {
    it('returns a Stanza if name is message', function () {
      var s = new Stanza('message')
      assert(s instanceof Stanza)
    })
    it('returns a Stanza if name is presence', function () {
      var s = new Stanza('presence')
      assert(s instanceof Stanza)
    })
    it('returns a Stanza if name is iq', function () {
      var s = new Stanza('iq')
      assert(s instanceof Stanza)
    })
    it('sets attributes and children for stanza', function () {
      var c = new Stanza('foo')
      var e = Stanza.createStanza('message', {'foo': 'bar'}, 'foo', c)
      assert(e instanceof Stanza)
      assert(e.is('message'))
      assert.equal(e.attrs.foo, 'bar')
      assert.equal(e.children.length, 2)
      assert.equal(e.children[0], 'foo')
      assert.equal(e.children[1], c)
      assert(e.children[1] instanceof Element)
    })
    it('returns an Element if name is not message presence or iq', function () {
      var s = new Stanza('foo')
      assert(s instanceof Element)
    })
    it('sets attributes and children for element', function () {
      var c = new Stanza('message')
      var e = Stanza.createStanza('foo', {'foo': 'bar'}, 'foo', c)
      assert(e instanceof Element)
      assert(e.is('foo'))
      assert.equal(e.attrs.foo, 'bar')
      assert.equal(e.children.length, 2)
      assert.equal(e.children[0], 'foo')
      assert.equal(e.children[1], c)
      assert(e.children[1] instanceof Stanza)
    })
  })

  describe('JID attributes', function () {
    describe('getFrom', function () {
      it('returns undefined if the from attr value is undefined', function () {
        var s = new Stanza('message', {from: undefined})
        assert.strictEqual(s.getFrom(), undefined)
      })
      it('returns undefined if the from attr value is null', function () {
        var s = new Stanza('message', {from: null})
        assert.strictEqual(s.getFrom(), undefined)
      })
      it('returns the from attr value if it is a JID', function () {
        var s = new Stanza('message', {from: new JID('foo@bar/foobar')})
        assert.strictEqual(s.getFrom(), s.attrs.from)
      })
      it('returns a JID if the from attr value is a string', function () {
        var s = new Stanza('message', {from: 'foo@bar/foobar'})
        var from = s.getFrom()
        assert(from instanceof JID)
        assert.equal(from.toString(), s.attrs.from)
      })
    })
    describe('getTo', function () {
      it('returns undefined if the to attr value is undefined', function () {
        var s = new Stanza('message', {to: undefined})
        assert.strictEqual(s.getTo(), undefined)
      })
      it('returns undefined if the to attr value is null', function () {
        var s = new Stanza('message', {to: null})
        assert.strictEqual(s.getTo(), undefined)
      })
      it('returns the to attr value if it is a JID', function () {
        var s = new Stanza('message', {to: new JID('foo@bar/foobar')})
        assert.strictEqual(s.getTo(), s.attrs.to)
      })
      it('returns a JID if the to attr value is a string', function () {
        var s = new Stanza('message', {to: 'foo@bar/foobar'})
        var to = s.getTo()
        assert(to instanceof JID)
        assert.equal(to.toString(), s.attrs.to)
      })
    })
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

      it('should return an iq stanza', function () {
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
      .c('foo', { xmlns: 'bar' })
      .up()
      .c('bar', { xmlns: 'foo' })
      .root()

    it('clones the stanza', function () {
      var cloned = originalStanza.clone()
      assert.equal(originalStanza.toString(), cloned.toString())
    })

    it('returns a Stanza instance', function () {
      var cloned = originalStanza.clone()
      assert(cloned instanceof Stanza)
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
