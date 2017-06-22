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

test('Socket', t => {
  const conn = new Connection()
  t.is(conn.Socket, net.Socket)
})

test('NS', t => {
  t.is(Connection.prototype.NS, NS_STREAM)
})

test('header()', t => {
  const conn = new Connection()
  conn.NS = 'foobar'
  t.is(
    conn.header(conn.headerElement()),
    `<?xml version='1.0'?><stream:stream version="1.0" xmlns="foobar" xmlns:stream="${NS_STREAM}">`
  )
})

test('footer()', t => {
  const conn = new Connection()
  t.is(conn.footer(), '</stream:stream>')
})
