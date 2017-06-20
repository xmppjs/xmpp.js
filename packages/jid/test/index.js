'use strict'

const test = require('ava')
const {spy} = require('sinon')
const jid = require('..')
const JID = require('../lib/JID')

test('equal calls equals on the first argument with the second argument', t => {
  const A = jid('foo')
  const B = jid('bar')
  spy(A, 'equals')
  jid.equal(A, B)
  t.true(A.equals.calledWith(B))
  A.equals.restore()
})

test('JID exports lib/JID', t => {
  t.is(jid.JID, JID)
})

test('calls parse if only first argument provided', t => {
  const addr = jid('foo@bar')
  t.true(addr instanceof JID)
  t.is(addr.toString(), 'foo@bar')
})

test('calls JID with passed arguments', t => {
  const addr = jid('foo', 'bar', 'baz')
  t.true(addr instanceof JID)
  t.is(addr.toString(), 'foo@bar/baz')
})

test('works as expected with new operator', t => {
  const addr = new jid('foo', 'bar', 'baz') // eslint-disable-line new-cap
  t.true(addr instanceof JID)
  t.is(addr.toString(), 'foo@bar/baz')
})
