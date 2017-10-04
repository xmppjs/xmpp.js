'use strict'

const test = require('ava')
const plugin = require('.')
const xml = require('@xmpp/xml')
const testPlugin = require('../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('name', t => {
  t.is(plugin.name, 'roster')
})

test.cb('get', t => {
  t.plan(2)

  t.context.entity.promise('send').then(stanza => {
    const {id} = stanza.attrs
    t.context.entity.emit('element', xml`
      <iq type='result' id='${id}'>
        <query xmlns="jabber:iq:roster">
          <item jid='foo@foobar.com' name='Foo' subscription='both'>
            <group>Friends</group>
            <group>Buddies</group>
          </item>
          <item jid='bar@foobar.com' name='Bar' subscription='from'>
          </item>
        </query>
      </iq>
    `)

    delete stanza.attrs.xmlns
    delete stanza.attrs.id
    t.deepEqual(stanza, xml`
      <iq type='get'>
        <query xmlns='jabber:iq:roster'/>
      </iq>
    `)
  })

  t.context.plugin.get().then(roster => {
    t.deepEqual(roster, [
      {jid: 'foo@foobar.com',
        name: 'Foo',
        subscription: 'both',
        groups: ['Friends', 'Buddies']},
      {jid: 'bar@foobar.com',
        name: 'Bar',
        subscription: 'from',
        groups: []}])
    t.end()
  })
})
