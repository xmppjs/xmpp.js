'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')
const xml = require('@xmpp/xml')

test('new Connection()', t => {
  const conn = new Connection()
  t.is(conn.domain, '')
  t.is(conn.lang, '')
  t.is(conn.jid, null)
  t.is(conn.timeout, 2000)
  t.true(conn instanceof EventEmitter)
})

test('isStanza()', t => {
  const conn = new Connection()
  conn.NS = 'bar'

  t.is(conn.isStanza(xml('foo')), false)
  t.is(conn.isStanza(xml('foo', {xmlns: 'bar'})), false)

  t.is(conn.isStanza(xml('presence', {xmlns: 'foo'})), false)
  t.is(conn.isStanza(xml('iq', {xmlns: 'foo'})), false)
  t.is(conn.isStanza(xml('message', {xmlns: 'foo'})), false)

  t.is(conn.isStanza(xml('presence')), true)
  t.is(conn.isStanza(xml('iq')), true)
  t.is(conn.isStanza(xml('message')), true)

  t.is(conn.isStanza(xml('presence', {xmlns: 'bar'})), true)
  t.is(conn.isStanza(xml('iq', {xmlns: 'bar'})), true)
  t.is(conn.isStanza(xml('message', {xmlns: 'bar'})), true)

  // Conn.online = false
  //
  // t.is(conn.isStanza(xml`<presence/>`), false)
  // t.is(conn.isStanza(xml`<iq/>`), false)
  // t.is(conn.isStanza(xml`<message/>`), false)
  // t.is(conn.isStanza(xml`<presence xmlns='bar'/>`), false)
  // t.is(conn.isStanza(xml`<iq xmlns='bar'/>`), false)
  // t.is(conn.isStanza(xml`<message xmlns='bar'/>`), false)
})

test('isNonza()', t => {
  const conn = new Connection()
  conn.NS = 'bar'

  t.is(conn.isNonza(xml('foo')), true)
  t.is(conn.isNonza(xml('foo', {xmlns: 'bar'})), true)

  t.is(conn.isNonza(xml('presence', {xmlns: 'foo'})), true)
  t.is(conn.isNonza(xml('iq', {xmlns: 'foo'})), true)
  t.is(conn.isNonza(xml('message', {xmlns: 'foo'})), true)

  t.is(conn.isNonza(xml('presence')), false)
  t.is(conn.isNonza(xml('iq')), false)
  t.is(conn.isNonza(xml('message')), false)

  t.is(conn.isNonza(xml('presence', {xmlns: 'bar'})), false)
  t.is(conn.isNonza(xml('iq', {xmlns: 'bar'})), false)
  t.is(conn.isNonza(xml('message', {xmlns: 'bar'})), false)

  // Conn.online = false
  //
  // t.is(conn.isNonza(xml`<presence/>`), true)
  // t.is(conn.isNonza(xml`<iq/>`), true)
  // t.is(conn.isNonza(xml`<message/>`), true)
  // t.is(conn.isNonza(xml`<presence xmlns='bar'/>`), true)
  // t.is(conn.isNonza(xml`<iq xmlns='bar'/>`), true)
  // t.is(conn.isNonza(xml`<message xmlns='bar'/>`), true)
})
