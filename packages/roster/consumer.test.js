'use strict'

const test = require('ava')
const {mockClient, promise} = require('@xmpp/test')

const _iqCallee = require('@xmpp/iq/callee')
const _roster = require('./consumer')
const JID = require('@xmpp/jid')

test('get', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  client.scheduleIncomingResult(
    <query xmlns="jabber:iq:roster" ver="ver1">
      <item jid="foo@foobar.com" ask="subscribe" name="Foo" subscription="both">
        <group>Friends</group>
        <group>Buddies</group>
      </item>
      <item
        jid="bar@foobar.com"
        approved="true"
        name="Bar"
        subscription="from"
      />
    </query>
  )

  return Promise.all([
    client.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:roster" />)
    }),
    roster.get().then(val => {
      t.deepEqual(val, [
        [
          {
            jid: new JID('foo@foobar.com'),
            name: 'Foo',
            subscription: 'both',
            approved: false,
            ask: true,
            groups: ['Friends', 'Buddies'],
          },
          {
            jid: new JID('bar@foobar.com'),
            name: 'Bar',
            subscription: 'from',
            approved: true,
            ask: false,
            groups: [],
          },
        ],
        'ver1',
      ])
    }),
  ])
})

test('get empty roster', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  client.scheduleIncomingResult(<query xmlns="jabber:iq:roster" />)

  return roster.get().then(val => {
    t.deepEqual(val, [[], undefined])
  })
})

test('get with ver, no changes', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  client.scheduleIncomingResult()

  return Promise.all([
    client.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:roster" ver="ver6" />)
    }),
    roster.get('ver6').then(val => {
      t.deepEqual(val, [])
    }),
  ])
})

test('get with ver, new roster', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  client.scheduleIncomingResult(
    <query xmlns="jabber:iq:roster" ver="ver7">
      <item jid="foo@bar" />
    </query>
  )

  return Promise.all([
    client.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:roster" ver="ver6" />)
    }),
    roster.get('ver6').then(val => {
      t.deepEqual(val, [
        [
          {
            jid: new JID('foo@bar'),
            groups: [],
            ask: false,
            subscription: 'none',
            approved: false,
            name: '',
          },
        ],
        'ver7',
      ])
    }),
  ])
})

test('set with string', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  client.scheduleIncomingResult()

  return Promise.all([
    client.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="jabber:iq:roster">
          <item jid="foo@bar" />
        </query>
      )
    }),
    roster.set('foo@bar').then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test('set with jid', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  client.scheduleIncomingResult()

  return Promise.all([
    client.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="jabber:iq:roster">
          <item jid="foo@bar" />
        </query>
      )
    }),
    roster.set(new JID('foo@bar')).then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test('set with object', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  client.scheduleIncomingResult()

  return Promise.all([
    client.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="jabber:iq:roster">
          <item jid="foo@bar" name="foobar">
            <group>a</group>
            <group>b</group>
          </item>
        </query>
      )
    }),
    roster
      .set({jid: 'foo@bar', groups: ['a', 'b'], name: 'foobar'})
      .then(val => {
        t.deepEqual(val, undefined)
      }),
  ])
})

test('remove', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  client.scheduleIncomingResult()

  return Promise.all([
    client.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="jabber:iq:roster">
          <item jid="foo@bar" subscription="remove" />
        </query>
      )
    }),
    roster.remove('foo@bar').then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test('push remove', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  return Promise.all([
    promise(roster, 'remove').then(([jid, ver]) => {
      t.deepEqual(jid, new JID('foo@bar'))
      t.is(ver, 'v1')
    }),
    client
      .fakeIncomingSet(
        <query xmlns="jabber:iq:roster" ver="v1">
          <item jid="foo@bar" subscription="remove" />
        </query>
      )
      .then(child => {
        t.is(child, undefined)
      }),
  ])
})

test('push set', t => {
  const {client, entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  return Promise.all([
    promise(roster, 'set').then(([item, ver]) => {
      t.deepEqual(item, {
        jid: new JID('foo@bar'),
        name: '',
        ask: false,
        approved: false,
        subscription: 'none',
        groups: [],
      })
      t.is(ver, undefined)
    }),
    client
      .fakeIncomingSet(
        <query xmlns="jabber:iq:roster">
          <item jid="foo@bar" subscription="none" />
        </query>
      )
      .then(child => {
        t.is(child, undefined)
      }),
  ])
})
