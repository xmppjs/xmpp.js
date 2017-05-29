'use strict'

const test = require('ava')
const {Stanza, IQ} = require('..')

test('is an instanceof Stanza', t => {
  const s = new IQ()
  t.true(s instanceof Stanza)
})

test('has "iq" as node name', t => {
  const s = new IQ()
  t.true(s.is('iq'))
  t.is(s.name, 'iq')
})

test('passes attrs argument down to Stanza', t => {
  const s = new IQ({foo: 'bar'})
  t.is(s.attrs.foo, 'bar')
})
