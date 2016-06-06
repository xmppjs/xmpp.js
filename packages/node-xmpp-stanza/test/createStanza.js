/* global describe, it */

'use strict'

var assert = require('assert')
var stanza = require('..')
var createStanza = stanza.createStanza
var Element = stanza.Element
var Stanza = stanza.Stanza

describe('createStanza', function () {
  it('returns a Stanza if name is message', function () {
    var s = createStanza('message')
    assert(s instanceof Stanza)
  })

  it('returns a Stanza if name is presence', function () {
    var s = createStanza('presence')
    assert(s instanceof Stanza)
  })

  it('returns a Stanza if name is iq', function () {
    var s = createStanza('iq')
    assert(s instanceof Stanza)
  })

  it('sets attributes and children for stanza', function () {
    var c = new Element('foo')
    var e = createStanza('message', {'foo': 'bar'}, 'foo', c)
    assert(e instanceof Stanza)
    assert(e.is('message'))
    assert.equal(e.attrs.foo, 'bar')
    assert.equal(e.children.length, 2)
    assert.equal(e.children[0], 'foo')
    assert.equal(e.children[1], c)
    assert(e.children[1] instanceof Element)
  })

  it('returns an Element if name is not message presence or iq', function () {
    var s = createStanza('foo')
    assert(s instanceof Element)
    assert(!(s instanceof Stanza))
  })

  it('sets attributes and children for element', function () {
    var c = new Stanza('message')
    var e = createStanza('foo', {'foo': 'bar'}, 'foo', c)
    assert(e instanceof Element)
    assert(e.is('foo'))
    assert.equal(e.attrs.foo, 'bar')
    assert.equal(e.children.length, 2)
    assert.equal(e.children[0], 'foo')
    assert.equal(e.children[1], c)
    assert(e.children[1] instanceof Stanza)
  })
})
