'use strict'

const test = require('ava')
const _Connection = require('../../../packages/connection')
const Connection = require('..')
const net = require('net')

const NS_STREAM = 'http://etherx.jabber.org/streams'

test('new Connection()', t => {
  const conn = new Connection()
  t.true(conn instanceof _Connection)
  t.is(conn.NS, NS_STREAM)
})

// test('waitHeader', t => {
//   const conn = new Connection()
//   conn.NS = 'foo:bar'
//
//   const el = xml`
//     <stream:stream xmlns="${conn.NS}" version="1.0" xmlns:stream="${NS_STREAM}" from="domain" id="some-id"/>
//   `
//
//   const p = conn.waitHeader('domain', 'lang')
//     .then((arg) => {
//       t.is(arg, el)
//     })
//
//   conn.parser.emit('start', el)
//
//   return p
// })

test('Socket', t => {
  const conn = new Connection()
  t.is(conn.Socket, net.Socket)
})

test('NS', t => {
  t.is(Connection.NS, NS_STREAM)
})

test('header()', t => {
  const conn = new Connection()
  conn.NS = 'foobar'
  t.is(
    conn.header('foo', 'bar'),
    `<?xml version='1.0'?><stream:stream to='foo' version='1.0' xml:lang='bar' xmlns='foobar' xmlns:stream='${NS_STREAM}' >`
  )
  t.is(
    conn.header('foo'),
    `<?xml version='1.0'?><stream:stream to='foo' version='1.0' xmlns='foobar' xmlns:stream='${NS_STREAM}' >`
  )
})

test('footer()', t => {
  const conn = new Connection()
  t.is(conn.footer(), '<stream:stream/>')
})
