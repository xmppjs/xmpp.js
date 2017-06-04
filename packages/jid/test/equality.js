'use strict'

const test = require('ava')
const jid = require('..')

test('should parsed JIDs should be equal', t => {
  const j1 = jid('foo@bar/baz')
  const j2 = jid('foo@bar/baz')
  t.is(j1.equals(j2), true)
})

test('should parsed JIDs should be not equal', t => {
  const j1 = jid('foo@bar/baz')
  const j2 = jid('quux@bar/baz')
  t.is(j1.equals(j2), false)
})

test('should ignore case in user', t => {
  const j1 = jid('foo@bar/baz')
  const j2 = jid('FOO@bar/baz')
  t.is(j1.equals(j2), true)
})

test('should ignore case in domain', t => {
  const j1 = jid('foo@bar/baz')
  const j2 = jid('foo@BAR/baz')
  t.is(j1.equals(j2), true)
})

test('should not ignore case in resource', t => {
  const j1 = jid('foo@bar/baz')
  const j2 = jid('foo@bar/Baz')
  t.is(j1.equals(j2), false)
})

test('should ignore international caseness', t => {
  const j1 = jid('föö@bär/baß')
  const j2 = jid('fÖö@BÄR/baß')
  t.is(j1.equals(j2), true)
})

test('should work with bare JIDs', t => {
  const j1 = jid('romeo@example.net/9519407536580081')
  const j2 = jid('romeo@example.net')
  t.is(j1.bare().equals(j2), true)
})
