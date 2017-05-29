'use strict'

const test = require('ava')
const {Stanza, Message} = require('..')

test('is an instanceof Stanza', t => {
  const s = new Message()
  t.true(s instanceof Stanza)
})

test('has "message" as node name', t => {
  const s = new Message()
  t.true(s.is('message'))
  t.is(s.name, 'message')
})

test('passes attrs argument down to Stanza', t => {
  const s = new Message({foo: 'bar'})
  t.is(s.attrs.foo, 'bar')
})
