'use strict'

const test = require('ava')
const {Stanza, equal} = require('..')

// this is already tested in ltx
test('returns true for equal stanzas', t => {
  const a = new Stanza('foo', {foo: 'bar'})
  const b = new Stanza('foo', {foo: 'bar'})
  t.true(equal(a, b))
})

test('returns false for non equal stanzas', t => {
  const a = new Stanza('foo', {foo: 'bar'})
  const b = new Stanza('bar', {foo: 'bar'})
  t.false(equal(a, b))
})
