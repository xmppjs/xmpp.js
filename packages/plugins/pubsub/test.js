'use strict'

const test = require('ava')
const plugin = require('.')
const testPlugin = require('../testPlugin')

const SERVICE = 'pubsub.foo'

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('name', t => {
  t.is(plugin.name, 'pubsub')
})

test('createNode', t => {
  t.context.scheduleIncomingResult(
    <pubsub xmlns="http://jabber.org/protocol/pubsub">
      <create node="foo" />
    </pubsub>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(
        child,
        <pubsub xmlns="http://jabber.org/protocol/pubsub">
          <create node="foo" />
        </pubsub>
      )
    }),
    t.context.plugin.createNode(SERVICE, 'foo').then(val => {
      t.is(val, 'foo')
    }),
  ])
})

test('createNode with config options', t => {
  t.context.scheduleIncomingResult(
    <pubsub xmlns="http://jabber.org/protocol/pubsub">
      <create node="foo" />
    </pubsub>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(
        child,
        <pubsub xmlns="http://jabber.org/protocol/pubsub">
          <create node="foo" />
          <configure>
            <x xmlns="jabber:x:data" type="submit">
              <field var="FORM_TYPE" type="hidden">
                <value>http://jabber.org/protocol/pubsub#node_config</value>
              </field>
              <field var="pubsub#access_model">
                <value>whitelist</value>
              </field>
              <field var="pubsub#max_items">
                <value>100</value>
              </field>
            </x>
          </configure>
        </pubsub>
      )
    }),
    t.context.plugin
      .createNode(SERVICE, 'foo', {
        'pubsub#access_model': 'whitelist',
        'pubsub#max_items': 100,
      })
      .then(val => {
        t.is(val, 'foo')
      }),
  ])
})

test('deleteNode', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <pubsub xmlns="http://jabber.org/protocol/pubsub">
          <delete node="foo" />
        </pubsub>
      )
    }),
    t.context.plugin.deleteNode(SERVICE, 'foo').then(val => {
      t.is(val, undefined)
    }),
  ])
})

test('publish', t => {
  t.context.scheduleIncomingResult(
    <pubsub xmlns="http://jabber.org/protocol/pubsub">
      <publish node="foo">
        <item id="foobar" />
      </publish>
    </pubsub>
  )

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <pubsub xmlns="http://jabber.org/protocol/pubsub">
          <publish node="foo">
            <item>
              <entry>
                <title>FooBar</title>
              </entry>
            </item>
          </publish>
        </pubsub>
      )
    }),
    t.context.plugin
      .publish(
        SERVICE,
        'foo',
        <item>
          <entry>
            <title>FooBar</title>
          </entry>
        </item>
      )
      .then(itemId => {
        t.is(itemId, 'foobar')
      }),
  ])
})

test('items', t => {
  t.context.scheduleIncomingResult(
    <pubsub xmlns="http://jabber.org/protocol/pubsub">
      <items node="foo">
        <item id="fooitem">
          <entry>Foo</entry>
        </item>
        <item id="baritem">
          <entry>Bar</entry>
        </item>
      </items>
    </pubsub>
  )

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <pubsub xmlns="http://jabber.org/protocol/pubsub">
          <items node="foo" />
        </pubsub>
      )
    }),
    t.context.plugin.items(SERVICE, 'foo').then(([items, rsm]) => {
      items.forEach(i => {
        i.parent = null
      })
      t.deepEqual(
        items[0],
        <item id="fooitem">
          <entry>Foo</entry>
        </item>
      )
      t.deepEqual(
        items[1],
        <item id="baritem">
          <entry>Bar</entry>
        </item>
      )
      t.is(rsm, undefined)
    }),
  ])
})

test('items with RSM', t => {
  t.context.scheduleIncomingResult(
    <pubsub xmlns="http://jabber.org/protocol/pubsub">
      <items node="foo">
        <item id="fooitem">
          <entry>Foo</entry>
        </item>
        <item id="baritem">
          <entry>Bar</entry>
        </item>
      </items>
      <set xmlns="http://jabber.org/protocol/rsm">
        <first>first@time</first>
        <last>last@time</last>
        <count>2</count>
      </set>
    </pubsub>
  )

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <pubsub xmlns="http://jabber.org/protocol/pubsub">
          <items node="foo" />
          <set xmlns="http://jabber.org/protocol/rsm">
            <first>first@time</first>
            <max>2</max>
          </set>
        </pubsub>
      )
    }),
    t.context.plugin
      .items(SERVICE, 'foo', {first: 'first@time', max: 2})
      .then(([items, rsm]) => {
        items.forEach(i => {
          i.parent = null
        })
        t.deepEqual(
          items[0],
          <item id="fooitem">
            <entry>Foo</entry>
          </item>
        )
        t.deepEqual(
          items[1],
          <item id="baritem">
            <entry>Bar</entry>
          </item>
        )
        t.deepEqual(rsm, {first: 'first@time', last: 'last@time', count: 2})
      }),
  ])
})

test('item-published event', t => {
  t.context.fakeIncoming(
    <message from={SERVICE}>
      <event xmlns="http://jabber.org/protocol/pubsub#event">
        <items node="foo">
          <item id="fooitem">
            <entry>Foo Bar</entry>
          </item>
        </items>
      </event>
    </message>
  )

  return Promise.all([
    t.context.plugin.promise('item-published:pubsub.foo').then(ev => {
      ev.entry.parent = null
      t.deepEqual(ev, {
        node: 'foo',
        id: 'fooitem',
        entry: <entry>Foo Bar</entry>,
      })
    }),
    t.context.plugin.promise('item-published:pubsub.foo:foo').then(ev => {
      ev.entry.parent = null
      t.deepEqual(ev, {
        id: 'fooitem',
        entry: <entry>Foo Bar</entry>,
      })
    }),
  ])
})

test('last-item-published event', t => {
  t.context.fakeIncoming(
    <message from={SERVICE}>
      <event xmlns="http://jabber.org/protocol/pubsub#event">
        <items node="foo">
          <item id="fooitem">
            <entry>Foo Bar</entry>
          </item>
        </items>
      </event>
      <delay xmlns="urn:xmpp:delay" stamp="2003-12-13T23:58:37Z" />
    </message>
  )

  return Promise.all([
    t.context.plugin.promise('last-item-published:pubsub.foo').then(ev => {
      ev.entry.parent = null
      t.deepEqual(ev, {
        node: 'foo',
        id: 'fooitem',
        stamp: '2003-12-13T23:58:37Z',
        entry: <entry>Foo Bar</entry>,
      })
    }),
    t.context.plugin.promise('last-item-published:pubsub.foo:foo').then(ev => {
      ev.entry.parent = null
      t.deepEqual(ev, {
        id: 'fooitem',
        stamp: '2003-12-13T23:58:37Z',
        entry: <entry>Foo Bar</entry>,
      })
    }),
  ])
})
