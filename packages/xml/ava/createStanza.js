'use strict'

const test = require('ava')
const {createStanza, Element, Stanza} = require('..')

test('returns a Stanza if name is message', t => {
  const s = createStanza('message')
  t.true(s instanceof Stanza)
})

test('returns a Stanza if name is presence', t => {
  const s = createStanza('presence')
  t.true(s instanceof Stanza)
})

test('returns a Stanza if name is iq', t => {
  const s = createStanza('iq')
  t.true(s instanceof Stanza)
})

test('sets attributes and children for stanza', t => {
  const c = new Element('foo')
  const e = createStanza('message', {'foo': 'bar'}, 'foo', c)
  t.true(e instanceof Stanza)
  t.true(e.is('message'))
  t.is(e.attrs.foo, 'bar')
  t.is(e.children.length, 2)
  t.is(e.children[0], 'foo')
  t.is(e.children[1], c)
  t.true(e.children[1] instanceof Element)
})

test('returns an Element if name is not message presence or iq', t => {
  const s = createStanza('foo')
  t.true(s instanceof Element)
  t.true(!(s instanceof Stanza))
})

test('sets attributes and children for element', t => {
  const c = new Stanza('message')
  const e = createStanza('foo', {'foo': 'bar'}, 'foo', c)
  t.true(e instanceof Element)
  t.true(e.is('foo'))
  t.is(e.attrs.foo, 'bar')
  t.is(e.children.length, 2)
  t.is(e.children[0], 'foo')
  t.is(e.children[1], c)
  t.true(e.children[1] instanceof Stanza)
})
