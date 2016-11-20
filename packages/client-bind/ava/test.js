import test from 'ava'
import {match, stanza, plugin} from './src'

test.skip('plugin', t => {
  const client = {}
  plugin(client)
  t.true(typeof client.bind === 'function')
})

test.skip('match()', t => {
  const features = <features/>
  t.is(match(features), undefined)

  const bind = <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/>
  features.cnode(bind)
  t.is(match(features), bind)
})

test.skip('stanza()', t => {
  t.deepEqual(stanza(), (
    <iq type='set'>
      <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/>
    </iq>
  ))

  t.deepEqual(stanza('foobar'), (
    <iq type='set'>
      <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'>
        <resource>foobar</resource>
      </bind>
    </iq>
  ))
})
