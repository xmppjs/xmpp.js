'use strict'

const test = require('ava')
const x = require('../lib/x')

test('ignore false children', t => {
  const el = x('foo', {}, false)

  t.is(el.children.length, 0)
})

test('ignore null children', t => {
  const el = x('foo', {}, null)

  t.is(el.children.length, 0)
})

test('ignore undefined children', t => {
  const el = x('foo', {}, undefined)

  t.is(el.children.length, 0)
})
