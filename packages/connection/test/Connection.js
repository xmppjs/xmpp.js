import test from 'ava'
import Connection from '../src'
import EventEmitter from 'events'

test.skip('new Connection()', t => {
  const conn = new Connection()
  t.is(conn.online, false)
  t.true(conn instanceof EventEmitter)
})

test.skip('isStanza()', t => {
  const conn = new Connection()
  conn.NS = 'bar'
  conn.online = true
  t.is(conn.isStanza(<presence/>), false)
  t.is(conn.isStanza(<iq/>), false)
  t.is(conn.isStanza(<message/>), false)
  t.is(conn.isStanza(<foo/>), false)
  t.is(conn.isStanza(<foo xmlns='bar'/>), false)
  t.is(conn.isStanza(<presence xmlns='bar'/>), true)
  t.is(conn.isStanza(<iq xmlns='bar'/>), true)
  t.is(conn.isStanza(<message xmlns='bar'/>), true)
})
