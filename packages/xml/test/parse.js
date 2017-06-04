'use strict'

const test = require('ava')
const parse = require('../lib/parse')
const Element = require('../lib/Element')

test('return an instance of Element', t => {
  t.true(parse`<message/>` instanceof Element)
})

test('parses xml', t => {
  t.is(parse`
    <foo>
        hello
      <bar/>
    </foo>
  `.toString(), '<foo>hello<bar/></foo>')
})
