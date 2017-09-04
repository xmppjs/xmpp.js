'use strict'

const test = require('ava')
const saslPlugin = require('./index')
const testPlugin = require('../testPlugin')
const xml = require('../../xml')

test('SASL failure', t => {
  const {plugin, entity} = testPlugin(saslPlugin)
  plugin.findMechanism = () => {
    return {}
  }

  const p = plugin.authenticate('foo', {}).catch(err => {
    t.true(err instanceof Error)
    t.is(err.name, 'SASLError')
    t.is(err.condition, 'not-authorized')
    t.is(err.message, 'not-authorized')
  })

  entity.emit(
    'nonza',
    xml(
      'failure',
      {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'},
      xml('not-authorized')
    )
  )

  return p
})

test('SASL failure with text element', t => {
  const {plugin, entity} = testPlugin(saslPlugin)
  plugin.findMechanism = () => {
    return {}
  }

  const p = plugin.authenticate('foo', {}).catch(err => {
    t.true(err instanceof Error)
    t.is(err.name, 'SASLError')
    t.is(err.condition, 'foo')
    t.is(err.text, 'bar')
  })

  entity.emit(
    'nonza',
    xml(
      'failure',
      {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'},
      xml('foo'),
      xml('text', {}, 'bar')
    )
  )

  return p
})
