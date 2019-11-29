'use strict'

const test = require('ava')
const Element = require('../lib/Element')

test('ignore __self and __source properties', t => {
  const el = new Element('foo', {
    __source: 'source',
    __self: 'self',
    foo: 'bar',
  })

  t.is(el.attrs.foo, 'bar')
  t.false('__source' in el.attrs)
  t.false('__self' in el.attrs)
})
