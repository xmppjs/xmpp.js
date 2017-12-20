'use strict'

const test = require('ava')
const Connection = require('..')
const xml = require('@xmpp/xml')

test.cb('#_onElement', t => {
  t.plan(2)
  const foo = <foo />
  const conn = new Connection()
  conn.on('element', el => {
    t.is(el, foo)
  })
  conn.on('nonza', el => {
    t.is(el, foo)
    t.end()
  })
  conn._onElement(foo)
})

test.cb('#_onElement stream:error', t => {
  t.plan(6)
  // prettier-ignore
  const foo = (
    xml('stream:error', {}, [
      xml('foo-bar', {xmlns: 'urn:ietf:params:xml:ns:xmpp-streams'}),
    ])
  )
  const conn = new Connection()
  conn._end = () => {
    t.end()
    return Promise.resolve()
  }
  conn.on('element', el => {
    t.is(el, foo)
  })
  conn.on('nonza', el => {
    t.is(el, foo)
  })
  conn.on('error', error => {
    t.is(error.name, 'StreamError')
    t.is(error.condition, 'foo-bar')
    t.is(error.message, 'foo-bar')
    t.is(error.element, foo)
  })
  conn._onElement(foo)
})
