'use strict'

const test = require('ava')
const tag = require('../lib/tag')
const Element = require('../lib/Element')

test('return an instance of Element', t => {
  t.true(tag`<message/>` instanceof Element)
})

test('strips whitespaces', t => {
  t.is(tag`
    <foo>
        hello
      <bar/>
    </foo>
  `.toString(), '<foo>hello<bar/></foo>')
})

test('does not strips whitespaces for substitutions', t => {
  t.is(tag`
    <foo>${'  yo  '}</foo>
  `.toString(), '<foo>  yo  </foo>')

  t.is(tag`
    <foo>${' foo '}<bar>${' bar '}</bar></foo>
  `.toString(), '<foo> foo <bar> bar </bar></foo>')

  t.skip.is(tag`
    <foo>${' foo '}${' bar '}</foo>
  `.toString(), '<foo> foo  bar </foo>')
})

test('escapes substitutions', t => {
  t.is(tag`
    <foo>${'<'}</foo>
  `.toString(), '<foo>&lt;</foo>')
})
