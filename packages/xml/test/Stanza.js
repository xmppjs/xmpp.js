'use strict'

const test = require('ava')
const xml = require('..')
const {Element, Stanza, IQ, Presence, Message} = xml

test('is an instance of Element', t => {
  const s = new Stanza('foobar')
  t.true(s instanceof Stanza)
  t.true(s instanceof Element)
})

test('new Stanza(iq) returns an iq stanza', t => {
  const s = new Stanza('iq')
  t.true(s instanceof Stanza)
  t.true(s.is('iq'))
})

test('new IQ() returns an iq stanza', t => {
  const s = new IQ()
  t.true(s instanceof Stanza)
  t.true(s.is('iq'))
})

test('new Stanza(message) returns a message stanza', t => {
  const s = new Stanza('message')
  t.true(s instanceof Stanza)
  t.true(s.is('message'))
})

test('new Message() returns a message stanza', t => {
  const s = new Message()
  t.true(s instanceof Stanza)
  t.true(s.is('message'))
})

test('new stanza(presence) returns a presence stanza', t => {
  const s = new Stanza('presence')
  t.true(s instanceof Stanza)
  t.true(s.is('presence'))
})

test('new Presence() returns a presence stanza', t => {
  const s = new Presence()
  t.true(s instanceof Stanza)
  t.true(s.is('presence'))
})
