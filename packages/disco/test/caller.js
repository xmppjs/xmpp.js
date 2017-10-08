'use strict'

const test = require('ava')
const plugin = require('../caller')
const testPlugin = require('../../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
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
    t.context.plugin.items('server', 'foo').then(items => {
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
    t.context.plugin.items().then(items => {
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
    t.context.plugin.info('server', 'foo').then(items => {
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
    t.context.plugin.info().then(info => {
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
