'use strict'

const test = require('ava')
const plugin = require('.')
const testPlugin = require('../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('name', t => {
  t.is(plugin.name, 'roster')
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
    t.context.plugin.get().then(val => {
      t.deepEqual(val, [
        [
          {
            jid: 'foo@foobar.com',
            name: 'Foo',
            subscription: 'both',
            approved: false,
            ask: true,
            groups: ['Friends', 'Buddies'],
          },
          {
            jid: 'bar@foobar.com',
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

  return t.context.plugin.get().then(val => {
    t.deepEqual(val, [[], undefined])
  })
})

test('get with ver, no changes', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:roster" ver="ver6" />)
    }),
    t.context.plugin.get('ver6').then(val => {
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
    t.context.plugin.get('ver6').then(val => {
      t.deepEqual(val, [
        [
          {
            jid: 'foo@bar',
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
    t.context.plugin.set('foo@bar').then(val => {
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
    t.context.plugin
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
    t.context.plugin.remove('foo@bar').then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test.serial('push remove', t => {
  return Promise.all([
    t.context.plugin.promise('remove').then(([jid, ver]) => {
      t.is(jid, 'foo@bar')
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
    t.context.plugin.promise('set').then(([item, ver]) => {
      t.deepEqual(item, {
        jid: 'foo@bar',
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
