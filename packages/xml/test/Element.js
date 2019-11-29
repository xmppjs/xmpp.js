'use strict'

const test = require('ava')
const Element = require('../lib/Element')

// TODO probably better to ignore in serialization instead
test('ignore __self and __source attributes', t => {
  const el = new Element('foo', {
    __source: 'source',
    __self: 'self',
    foo: 'bar',
  })

  t.is(el.attrs.foo, 'bar')
  t.false('__source' in el.attrs)
  t.false('__self' in el.attrs)
})
