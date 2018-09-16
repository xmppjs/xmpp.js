'use strict'

/* eslint node/no-extraneous-require: 0 */

const test = require('ava')
const sasl = require('.')
const xml = require('@xmpp/xml')
const _streamFeatures = require('@xmpp/stream-features')
const _middleware = require('@xmpp/middleware')
const _router = require('@xmpp/router')
const {context} = require('@xmpp/test')

test.beforeEach(t => {
  const ctx = context()
  const middleware = _middleware(ctx.entity)
  const router = _router(middleware)
  const streamFeatures = _streamFeatures(router)
  t.context = ctx
  t.context.sasl = sasl(streamFeatures)
})

test.skip('SASL failure', t => {
  const {sasl, entity} = t.context
  sasl.findMechanism = () => {
    return {}
  }

  const p = sasl.authenticate('foo', {}).catch(err => {
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

test.skip('SASL failure with text element', t => {
  const {sasl, entity} = t.context
  sasl.findMechanism = () => {
    return {}
  }

  const p = sasl.authenticate('foo', {}).catch(err => {
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
