'use strict'

const test = require('ava')
const {context} = require('@xmpp/test')
const _middleware = require('@xmpp/middleware')
const _iqCaller = require('@xmpp/iq/caller')
const _iqCallee = require('@xmpp/iq/callee')
const _rosterCaller = require('./caller')
const {promise} = require('@xmpp/events')
const JID = require('@xmpp/jid')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware(entity)
  const iqCaller = _iqCaller({middleware, entity})
  const iqCallee = _iqCallee({middleware, entity})
  ctx.rosterCaller = _rosterCaller({iqCaller, entity, iqCallee})
  t.context = ctx
})

test('get', t => {
  t.context.scheduleIncomingResult(
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
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:roster" />)
    }),
    t.context.rosterCaller.get().then(val => {
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
  t.context.scheduleIncomingResult(<query xmlns="jabber:iq:roster" />)

  return t.context.rosterCaller.get().then(val => {
    t.deepEqual(val, [[], undefined])
  })
})

test('get with ver, no changes', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:roster" ver="ver6" />)
    }),
    t.context.rosterCaller.get('ver6').then(val => {
      t.deepEqual(val, [])
    }),
  ])
})

test('get with ver, new roster', t => {
  t.context.scheduleIncomingResult(
    <query xmlns="jabber:iq:roster" ver="ver7">
      <item jid="foo@bar" />
    </query>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:roster" ver="ver6" />)
    }),
    t.context.rosterCaller.get('ver6').then(val => {
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
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="jabber:iq:roster">
          <item jid="foo@bar" />
        </query>
      )
    }),
    t.context.rosterCaller.set('foo@bar').then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test('set with jid', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="jabber:iq:roster">
          <item jid="foo@bar" />
        </query>
      )
    }),
    t.context.rosterCaller.set(new JID('foo@bar')).then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test('set with object', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
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
    t.context.rosterCaller
      .set({jid: 'foo@bar', groups: ['a', 'b'], name: 'foobar'})
      .then(val => {
        t.deepEqual(val, undefined)
      }),
  ])
})

test('remove', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="jabber:iq:roster">
          <item jid="foo@bar" subscription="remove" />
        </query>
      )
    }),
    t.context.rosterCaller.remove('foo@bar').then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test.serial('push remove', t => {
  return Promise.all([
    promise(t.context.rosterCaller, 'remove').then(([jid, ver]) => {
      t.deepEqual(jid, new JID('foo@bar'))
      t.is(ver, 'v1')
    }),
    t.context
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

test.serial('push set', t => {
  return Promise.all([
    promise(t.context.rosterCaller, 'set').then(([item, ver]) => {
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
    t.context
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
