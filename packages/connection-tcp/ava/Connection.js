const test = require('ava')
const _Connection = require('../../../packages/connection')
const Connection = require('..')
const xml = require('@xmpp/xml')
const net = require('net')
const StreamParser = require('../lib/StreamParser')

const NS_STREAM = 'http://etherx.jabber.org/streams'

test('new Connection()', t => {
  const conn = new Connection()
  t.true(conn instanceof _Connection)
  t.is(conn.NS, NS_STREAM)
})

test.cb('waitHeader', t => {
  const conn = new Connection()
  conn.NS = 'foo:bar'
  conn.waitHeader('domain', 'lang', t.end)
  conn.parser.emit('startElement', 'stream:stream', {
    xmlns: 'foo:bar',
    'xmlns:stream': NS_STREAM,
    from: 'domain',
    id: 'some-id'
  })
})

test('Socket', t => {
  const conn = new Connection()
  conn.Socket = net.Socket
})

test('Parser', t => {
  const conn = new Connection()
  conn.Parser = StreamParser
})

test('NS', t => {
  t.is(Connection.NS, NS_STREAM)
})

test('header()', t => {
  const conn = new Connection()
  conn.NS = 'foobar'
  t.is(conn.header('foo', 'bar'),
    xml.tagString`
      <?xml version='1.0'?>
      <stream:stream to='foo' version='1.0' xml:lang='bar' xmlns='foobar' xmlns:stream='${NS_STREAM}'>
    `
  )
})

test('footer()', t => {
  const conn = new Connection()
  t.is(conn.footer(), '<stream:stream/>')
})

test('match()', t => {
  t.is(Connection.match('xmpp:foobar'), 'xmpp:foobar')
  t.is(Connection.match('xmpp://foobar'), 'xmpp://foobar')
  t.is(Connection.match('xmpp:foobar:5222'), 'xmpp:foobar:5222')

  t.is(Connection.match('foobar:2222'), false)
  t.is(Connection.match('ws://foobar:2222'), false)
  t.is(Connection.match('wss://foobar:2222'), false)
  t.is(Connection.match('http://foobar:2222'), false)
  t.is(Connection.match('https://foobar:2222'), false)
})
