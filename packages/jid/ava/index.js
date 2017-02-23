'use strict'

const test = require('ava')
const spy = require('sinon').spy
const index = require('../index')
const JID = require('../lib/JID')
const tag = require('../lib/tag')

test('is returns true if the passed argument is an instance of JID', t => {
  const addr = new JID('foo')
  t.is(index.is(addr), true)
})

test('is returns false if the passed argument is not an instance of JID', t => {
  const addr = function () {}
  t.is(index.is(addr), false)
})

test('equal calls equals on the first argument with the second argument', t => {
  const A = new JID('foo')
  const B = new JID('bar')
  spy(A, 'equals')
  index.equal(A, B)
  t.true(A.equals.calledWith(B))
  A.equals.restore()
})

test('tag exports lib/tag', t => {
  t.is(index.tag, tag)
})

test('JID exports lib/JID', t => {
  t.is(index.JID, JID)
})

test('calls tag with passed arguments if the first argument is an array', t => {
  // const addr = tag`${'local'}@${'domain'}/${'resource'}`
  const addr = index(['foo', ''], 'bar', 'baz')
  t.true(addr instanceof JID)
  t.is(addr.toString(), 'foobarbaz')
})

test('calls JId with passed arguments', t => {
  const addr = index('foo', 'bar', 'baz')
  t.true(addr instanceof JID)
  t.is(addr.toString(), 'foo@bar/baz')
})

test('works as expected with new operator', t => {
  const addr = new index('foo', 'bar', 'baz') // eslint-disable-line
  t.true(addr instanceof JID)
  t.is(addr.toString(), 'foo@bar/baz')
})
