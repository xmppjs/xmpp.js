'use strict'

const test = require('ava')
const caps = require('./index')
const xml = require('@xmpp/xml')

test('5.2 Simple Generation Example', t => {
  const query = (
    <query xmlns="http://jabber.org/protocol/disco#info">
      <identity category="client" type="pc" name="Exodus 0.9.1" />
      <feature var="http://jabber.org/protocol/caps" />
      <feature var="http://jabber.org/protocol/disco#info" />
      <feature var="http://jabber.org/protocol/disco#items" />
      <feature var="http://jabber.org/protocol/muc" />
    </query>
  )

  return caps.hash(query).then(ver => {
    t.is(ver, 'QgayPKawpkPSDYmwT/WM94uAlu0=')
  })
})

test('5.3 Complex Generation Example', t => {
  const query = (
    <query
      xmlns="http://jabber.org/protocol/disco#info"
      node="http://psi-im.org#q07IKJEyjvHSyhy//CH0CxmKi8w="
    >
      <feature var="http://jabber.org/protocol/caps" />
      <feature var="http://jabber.org/protocol/disco#info" />
      <feature var="http://jabber.org/protocol/disco#items" />
      <feature var="http://jabber.org/protocol/muc" />
      <x xmlns="jabber:x:data" type="result">
        <field var="FORM_TYPE" type="hidden">
          <value>urn:xmpp:dataforms:softwareinfo</value>
        </field>
        <field var="ip_version">
          <value>ipv4</value>
          <value>ipv6</value>
        </field>
        <field var="os">
          <value>Mac</value>
        </field>
        <field var="os_version">
          <value>10.5.1</value>
        </field>
        <field var="software">
          <value>Psi</value>
        </field>
        <field var="software_version">
          <value>0.11</value>
        </field>
      </x>
    </query>
  )

  query.prepend(
    xml('identity', {
      'xml:lang': 'el',
      category: 'client',
      name: 'Ψ 0.11',
      type: 'pc',
    })
  )

  query.prepend(
    xml('identity', {
      'xml:lang': 'en',
      category: 'client',
      name: 'Psi 0.11',
      type: 'pc',
    })
  )

  return caps.hash(query).then(ver => {
    t.is(ver, 'q07IKJEyjvHSyhy//CH0CxmKi8w=')
  })
})

test.skip('multiple forms', t => {
  const query = (
    <query xmlns="http://jabber.org/protocol/disco#info">
      <feature var="http://jabber.org/protocol/disco#info" />
      <x xmlns="jabber:x:data" type="result">
        <field var="FORM_TYPE" type="hidden">
          <value>b</value>
        </field>
      </x>
      <x xmlns="jabber:x:data" type="result">
        <field var="FORM_TYPE" type="hidden">
          <value>a</value>
        </field>
      </x>
    </query>
  )

  return caps.hash(query).then(ver => {
    t.is(ver, 'q07IKJEyjvHSyhy//CH0CxmKi8w=')
  })
})
