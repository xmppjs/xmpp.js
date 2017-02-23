'use strict'

const test = require('ava')
const {Stanza} = require('..')

const s = new Stanza('iq')

test('should set "from" attribute', t => {
  s.from = 'l@d'
  t.is(s.attrs.from, 'l@d')
})

test('should get "from" attribute', t => {
  s.attrs.from = 'd@l'
  t.is(s.from, 'd@l')
})

test('should set "to" attribute', t => {
  s.to = 'l@d'
  t.is(s.attrs.to, 'l@d')
})

test('should get "to" attribute', t => {
  s.attrs.to = 'd@l'
  t.is(s.to, 'd@l')
})

test('should set "id" attribute', t => {
  s.id = 'i'
  t.is(s.attrs.id, 'i')
})

test('should get "id" attribute', t => {
  s.attrs.id = 'd'
  t.is(s.id, 'd')
})

test('should set "type" attribute', t => {
  s.type = 'error'
  t.is(s.attrs.type, 'error')
})

test('should get "type" attribute', t => {
  s.attrs.type = 'result'
  t.is(s.type, 'result')
})
