'use strict'

const test = require('ava')
const xml = require('..')
const tag = require('../lib/tag')
const Stanza = require('../lib/Stanza')

test('exported correctly', t => {
  t.is(xml.tag, tag)
})

test('parses the stanza and return a Stanza object', t => {
  const stanza = tag`<message/>`
  t.true(stanza instanceof Stanza)
})
