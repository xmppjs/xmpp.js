'use strict'

const test = require('ava')
const {match, stanza, plugin} = require('.')
const xml = require('@xmpp/xml')

test.skip('plugin', t => {
  const client = {}
  plugin(client)
  t.true(typeof client.bind === 'function')
})

test.skip('match()', t => {
  const features = xml('features')
  t.is(match(features), undefined)

  const bind = xml('bind', {xmlns: 'urn:ietf:params:xml:ns:xmpp-bind'})
  features.append(bind)
  t.is(match(features), bind)
})

test.skip('stanza()', t => {
  t.deepEqual(
    stanza(),
    xml`
    <iq type='set'>
      <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/>
    </iq>
  `
  )

  t.deepEqual(
    stanza('foobar'),
    `
    <iq type='set'>
      <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'>
        <resource>foobar</resource>
      </bind>
    </iq>
  `
  )
})
