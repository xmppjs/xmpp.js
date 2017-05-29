'use strict'

const test = require('ava')
const {Stanza, Presence} = require('..')

test('is an instanceof Stanza', t => {
  const s = new Presence()
  t.true(s instanceof Stanza)
})

test('has "presence" as node name', t => {
  const s = new Presence()
  t.true(s.is('presence'))
  t.is(s.name, 'presence')
})

test('passes attrs argument down to Stanza', t => {
  const s = new Presence({foo: 'bar'})
  t.is(s.attrs.foo, 'bar')
})
