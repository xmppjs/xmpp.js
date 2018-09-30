'use strict'

const test = require('ava')
const {Component, xml} = require('..')

test('calling send sanitize the from attribute', t => {
  const entity = new Component()
  entity.write = () => Promise.resolve()
  let el

  el = xml('el')
  entity.send(el)
  t.is(el.attrs.from, undefined)

  entity.jid = 'test.foobar'

  el = xml('el')
  entity.send(el)
  t.is(el.attrs.from, 'test.foobar')

  el = xml('el', {from: 'bar'})
  entity.send(el)
  t.is(el.attrs.from, 'bar')
})

test('calling send sanitize the to attribute', t => {
  const entity = new Component()
  entity.write = () => Promise.resolve()
  let el

  el = xml('el')
  entity.send(el)
  t.is(el.attrs.to, undefined)

  entity.domain = 'foobar'

  el = xml('el')
  entity.send(el)
  t.is(el.attrs.to, 'foobar')

  el = xml('el', {to: 'bar'})
  entity.send(el)
  t.is(el.attrs.to, 'bar')
})
