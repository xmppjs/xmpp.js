'use strict'

const test = require('ava')
const plugin = require('.')
const xml = require('@xmpp/xml')
const testPlugin = require('../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('name', t => {
  t.is(plugin.name, 'pubsub')
})

test.cb('createNode', t => {
  t.plan(7)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'set')
    const [pubsub] = stanza.children
    t.is(pubsub.name, 'pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const [create] = pubsub.children
    t.is(create.name, 'create')
    t.is(create.attrs.node, 'foo')

    t.context.entity.emit('element', xml`
      <iq type='result' id='${stanza.attrs.id}'>
        <pubsub xmlns='http://jabber.org/protocol/pubsub'>
          <create node='foo'/>
        </pubsub>
      </iq>
    `)
  })

  t.context.plugin.createNode('foo')
  .then(nodeId => {
    t.is(nodeId, 'foo')
    t.end()
  })
})

test.cb('createNode with config options', t => {
  t.plan(20)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'set')
    const [pubsub] = stanza.children
    t.is(pubsub.name, 'pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const [create, configure] = pubsub.children
    t.is(create.name, 'create')
    t.is(create.attrs.node, 'foo')
    t.is(configure.name, 'configure')
    const [x] = configure.children
    t.is(x.name, 'x')
    t.is(x.attrs.xmlns, 'jabber:x:data')
    t.is(x.attrs.type, 'submit')
    const [formType, accessModel, maxItems] = x.children
    t.is(formType.name, 'field')
    t.is(formType.attrs.var, 'FORM_TYPE')
    t.is(formType.getChild('value').text(), 'http://jabber.org/protocol/pubsub#node_config')
    t.is(accessModel.name, 'field')
    t.is(accessModel.attrs.var, 'pubsub#access_model')
    t.is(accessModel.getChild('value').text(), 'whitelist')
    t.is(maxItems.name, 'field')
    t.is(maxItems.attrs.var, 'pubsub#max_items')
    t.is(maxItems.getChild('value').text(), '100')

    t.context.entity.emit('element', xml`
      <iq type='result' id='${stanza.attrs.id}'>
        <pubsub xmlns='http://jabber.org/protocol/pubsub'>
          <create node='foo'/>
        </pubsub>
      </iq>
    `)
  })

  t.context.plugin.createNode(
    'foo',
    {'pubsub#access_model': 'whitelist', 'pubsub#max_items': 100})
  .then(nodeId => {
    t.is(nodeId, 'foo')
    t.end()
  })
})

test.cb('deleteNode', t => {
  t.plan(6)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'set')
    const [pubsub] = stanza.children
    t.is(pubsub.name, 'pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const [del] = pubsub.children
    t.is(del.name, 'delete')
    t.is(del.attrs.node, 'foo')

    t.context.entity.emit('element', xml`
      <iq type='result' id='${stanza.attrs.id}'>
      </iq>
    `)
  })

  t.context.plugin.deleteNode('foo')
  .then(t.end)
})

test.cb('publish', t => {
  t.plan(9)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'set')
    const [pubsub] = stanza.children
    t.is(pubsub.name, 'pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const [publish] = pubsub.children
    t.is(publish.name, 'publish')
    t.is(publish.attrs.node, 'foo')
    const [item] = publish.children
    t.is(item.name, 'item')
    const [entry] = item.children
    t.is(entry.name, 'entry')

    t.context.entity.emit('element', xml`
      <iq type='result' id='${stanza.attrs.id}'>
        <pubsub xmlns='http://jabber.org/protocol/pubsub'>
          <publish node='foo'>
            <item id='foobar'/>
          </publish>
        </pubsub>
      </iq>
    `)
  })

  t.context.plugin.publish('foo', xml`<item><entry><title>FooBar</title></entry></item>`)
  .then(itemId => {
    t.is(itemId, 'foobar')
    t.end()
  })
})

test.cb('items', t => {
  t.plan(13)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'get')
    const [pubsub] = stanza.children
    t.is(pubsub.name, 'pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const [items] = pubsub.children
    t.is(items.name, 'items')
    t.is(items.attrs.node, 'foo')

    t.context.entity.emit('element', xml`
      <iq type='result' id='${stanza.attrs.id}'>
        <pubsub xmlns='http://jabber.org/protocol/pubsub'>
          <items node='foo'>
            <item id='fooitem'>
              <entry>Foo</entry>
            </item>
            <item id='baritem'>
              <entry>Bar</entry>
            </item>
          </items>
        </pubsub>
      </iq>
    `)
  })

  t.context.plugin.items('foo')
  .then(items => {
    t.is(items.length, 2)
    t.is(items[0].name, 'item')
    t.is(items[0].attrs.id, 'fooitem')
    t.is(items[0].getChildText('entry'), 'Foo')
    t.is(items[1].name, 'item')
    t.is(items[1].attrs.id, 'baritem')
    t.is(items[1].getChildText('entry'), 'Bar')
    t.end()
  })
})
