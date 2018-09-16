'use strict'

const test = require('ava')
const {context} = require('@xmpp/test')
const _discoCaller = require('.')
const _middleware = require('@xmpp/middleware')
const _iqCaller = require('@xmpp/iq-caller')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware(entity)
  const iqCaller = _iqCaller({middleware, entity})
  ctx.discoCaller = _discoCaller({iqCaller})
  t.context = ctx
})

test('#items with node', t => {
  t.context.scheduleIncomingResult(
    <query xmlns="http://jabber.org/protocol/disco#items">
      <item jid="people.shakespeare.lit" name="Directory of Characters" />
      <item jid="plays.shakespeare.lit" name="Play-Specific Chatrooms" />
    </query>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="http://jabber.org/protocol/disco#items" node="foo" />
      )
    }),
    t.context.discoCaller.items('server', 'foo').then(items => {
      t.deepEqual(items, [
        {
          jid: 'people.shakespeare.lit',
          name: 'Directory of Characters',
        },
        {
          jid: 'plays.shakespeare.lit',
          name: 'Play-Specific Chatrooms',
        },
      ])
    }),
  ])
})

test('#items without node', t => {
  t.context.scheduleIncomingResult(
    <query xmlns="http://jabber.org/protocol/disco#items">
      <item jid="people.shakespeare.lit" name="Directory of Characters" />
      <item jid="plays.shakespeare.lit" name="Play-Specific Chatrooms" />
    </query>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="http://jabber.org/protocol/disco#items" />
      )
    }),
    t.context.discoCaller.items().then(items => {
      t.deepEqual(items, [
        {
          jid: 'people.shakespeare.lit',
          name: 'Directory of Characters',
        },
        {
          jid: 'plays.shakespeare.lit',
          name: 'Play-Specific Chatrooms',
        },
      ])
    }),
  ])
})

test('#info with node', t => {
  t.context.scheduleIncomingResult(
    <query xmlns="http://jabber.org/protocol/disco#info">
      <identity
        category="directory"
        type="chatroom"
        name="Play-Specific Chatrooms"
      />
      <feature var="http://jabber.org/protocol/disco#info" />
    </query>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="http://jabber.org/protocol/disco#info" node="foo" />
      )
    }),
    t.context.discoCaller.info('server', 'foo').then(items => {
      t.deepEqual(items, [
        ['http://jabber.org/protocol/disco#info'],
        [
          {
            category: 'directory',
            type: 'chatroom',
            name: 'Play-Specific Chatrooms',
          },
        ],
      ])
    }),
  ])
})

test('#info without node', t => {
  t.context.scheduleIncomingResult(
    <query xmlns="http://jabber.org/protocol/disco#info">
      <identity
        category="directory"
        type="chatroom"
        name="Play-Specific Chatrooms"
      />
      <feature var="http://jabber.org/protocol/disco#info" />
    </query>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(
        child,
        <query xmlns="http://jabber.org/protocol/disco#info" />
      )
    }),
    t.context.discoCaller.info().then(info => {
      t.deepEqual(info, [
        ['http://jabber.org/protocol/disco#info'],
        [
          {
            category: 'directory',
            type: 'chatroom',
            name: 'Play-Specific Chatrooms',
          },
        ],
      ])
    }),
  ])
})
