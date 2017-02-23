'use strict'

const test = require('ava')
const {Stanza, Element} = require('..')

const originalStanza = new Stanza('iq')
  .c('foo', { xmlns: 'bar' }).up()
  .c('bar', { xmlns: 'foo' }).root()

test('clones the stanza', t => {
  const cloned = originalStanza.clone()
  t.is(originalStanza.toString(), cloned.toString())
  t.true(originalStanza.equals(cloned))
})

test('returns a Stanza instance', t => {
  const cloned = originalStanza.clone()
  t.true(cloned instanceof Stanza)
})

test('uses the correct constructor for children', t => {
  const cloned = originalStanza.clone()
  t.true(cloned.children[0] instanceof Element)
})

test("doesn't modify clone if original is modified", t => {
  const cloned = originalStanza.clone()
  originalStanza.attr('foo', 'bar')
  t.is(cloned.attr('foo'), undefined)
  originalStanza.c('foobar')
  t.is(cloned.getChild('foobar'), undefined)
})
