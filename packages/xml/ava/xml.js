'use strict'

const test = require('ava')
const xml = require('..')
const ltx = require('ltx')

test('exports ltx', t => {
  t.is(xml.ltx, ltx)
})

test('exports ltx properties', t => {
  Object.keys(ltx).forEach((key) => {
    t.true(key in xml)
  })
})
