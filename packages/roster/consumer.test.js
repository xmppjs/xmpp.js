'use strict'

const test = require('ava')
const {mockClient, promise, mockInput} = require('@xmpp/test')

const _iqCallee = require('@xmpp/iq/callee')
const _roster = require('./consumer')
const JID = require('@xmpp/jid')

test('get', t => {
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  entity.scheduleIncomingResult(
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
    entity.catchOutgoingGet().then(child => {
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
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  entity.scheduleIncomingResult(<query xmlns="jabber:iq:roster" />)

  return roster.get().then(val => {
    t.deepEqual(val, [[], undefined])
  })
})

test('get with ver, no changes', t => {
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  entity.scheduleIncomingResult()

  return Promise.all([
    entity.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:roster" ver="ver6" />)
    }),
    roster.get('ver6').then(val => {
      t.deepEqual(val, [])
    }),
  ])
})

test('get with ver, new roster', t => {
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  entity.scheduleIncomingResult(
    <query xmlns="jabber:iq:roster" ver="ver7">
      <item jid="foo@bar" />
    </query>
  )

  return Promise.all([
    entity.catchOutgoingGet().then(child => {
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
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  entity.scheduleIncomingResult()

  return Promise.all([
    entity.catchOutgoingSet().then(child => {
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
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  entity.scheduleIncomingResult()

  return Promise.all([
    entity.catchOutgoingSet().then(child => {
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
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  entity.scheduleIncomingResult()

  return Promise.all([
    entity.catchOutgoingSet().then(child => {
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
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  entity.scheduleIncomingResult()

  return Promise.all([
    entity.catchOutgoingSet().then(child => {
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

test('push remove', async t => {
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  const promiseRosterRemove = promise(roster, 'remove')

  mockInput(
    entity,
    <iq type="set" from={entity.jid.bare()}>
      <query xmlns="jabber:iq:roster" ver="v1">
        <item jid="foo@bar" subscription="remove" />
      </query>
    </iq>
  )

  t.deepEqual(await promiseRosterRemove, [new JID('foo@bar'), 'v1'])
})

test('push set', async t => {
  const {entity, iqCaller, middleware} = mockClient()
  const iqCallee = _iqCallee({middleware, entity})
  const roster = _roster({entity, iqCaller, iqCallee})

  const promiseRosterSet = promise(roster, 'set')

  mockInput(
    entity,
    <iq type="set" from={entity.jid.bare()}>
      <query xmlns="jabber:iq:roster">
        <item jid="foo@bar" subscription="none" />
      </query>
    </iq>
  )

  t.deepEqual(await promiseRosterSet, [
    {
      jid: new JID('foo@bar'),
      name: '',
      ask: false,
      approved: false,
      subscription: 'none',
      groups: [],
    },
    undefined,
  ])
})
