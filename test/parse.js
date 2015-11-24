/* global describe, it */

'use strict'

var assert = require('assert')
var stanza = require('../index')
var Stanza = stanza.Stanza
var Element = stanza.Element
var parse = stanza.parse

describe('parse', function () {
  it('returns an instance of Stanza for "message"', function () {
    var s = parse('<message/>')
    assert(s instanceof Stanza)
    assert(s.is('message'))
  })

  it('returns an instance of Stanza for "presence"', function () {
    var s = parse('<presence/>')
    assert(s instanceof Stanza)
    assert(s.is('presence'))
  })

  it('returns an instance of Stanza for "IQ"', function () {
    var s = parse('<iq/>')
    assert(s instanceof Stanza)
    assert(s.is('iq'))
  })

  it('returns an instance of Element for anything else', function () {
    var s = parse('<foobar/>')
    assert(s instanceof Element)
    assert(s.is('foobar'))
    assert(!(s instanceof Stanza))
  })

  it('passes attributes and children down', function () {
    var s = parse('<message type="chat" from="foo@bar">hello<element some="thing"/></message>')
    assert(s instanceof Stanza)
    assert(s.is('message'))
    assert.equal(s.attrs.type, 'chat')
    assert.equal(s.attrs.from, 'foo@bar')
    assert.equal(s.children[0], 'hello')
    assert(s.children[1] instanceof Element)
    assert(s.children[1].is('element'))
    assert.equal(s.children[1].attrs.some, 'thing')
    assert.equal(s.children.length, 2)
  })
})
