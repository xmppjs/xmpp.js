'use strict'

const test = require('ava')
const {Stanza, Element, parse} = require('..')

test('returns an instance of Stanza for "message"', t => {
  const s = parse('<message/>')
  t.true(s instanceof Stanza)
  t.true(s.is('message'))
})

test('returns an instance of Stanza for "presence"', t => {
  const s = parse('<presence/>')
  t.true(s instanceof Stanza)
  t.true(s.is('presence'))
})

test('returns an instance of Stanza for "IQ"', t => {
  const s = parse('<iq/>')
  t.true(s instanceof Stanza)
  t.true(s.is('iq'))
})

test('returns an instance of Element for anything else', t => {
  const s = parse('<foobar/>')
  t.true(s instanceof Element)
  t.true(s.is('foobar'))
  t.true(!(s instanceof Stanza))
})

test('passes attributes and children down', t => {
  const s = parse('<message type="chat" from="foo@bar">hello<element some="thing"/></message>')
  t.true(s instanceof Stanza)
  t.true(s.is('message'))
  t.is(s.attrs.type, 'chat')
  t.is(s.attrs.from, 'foo@bar')
  t.is(s.children[0], 'hello')
  t.true(s.children[1] instanceof Element)
  t.true(s.children[1].is('element'))
  t.is(s.children[1].attrs.some, 'thing')
  t.is(s.children.length, 2)
})
