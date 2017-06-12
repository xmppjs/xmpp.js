'use strict'

const test = require('ava')
const plugin = require('.')
const xml = require('@xmpp/xml')
const testPlugin = require('../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin('pubsub.foo'))
})

test('name', t => {
  t.is(plugin().name, 'pubsub')
})

test.cb('createNode', t => {
  t.plan(5)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'set')
    const pubsub = stanza.getChild('pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const create = pubsub.getChild('create')
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
  t.plan(17)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'set')
    const pubsub = stanza.getChild('pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const create = pubsub.getChild('create')
    t.is(create.attrs.node, 'foo')
    const configure = pubsub.getChild('configure')
    t.is(configure.name, 'configure')
    const x = configure.getChild('x')
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
  t.plan(4)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'set')
    const pubsub = stanza.getChild('pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const del = pubsub.getChild('delete')
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
  t.plan(6)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'set')
    const pubsub = stanza.getChild('pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const publish = pubsub.getChild('publish')
    t.is(publish.attrs.node, 'foo')
    const item = publish.getChild('item')
    const entry = item.getChild('entry')
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
  t.plan(11)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'get')
    const pubsub = stanza.getChild('pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const items = pubsub.getChild('items')
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
  .then(res => {
    t.is(res.items.length, 2)
    t.is(res.items[0].name, 'item')
    t.is(res.items[0].attrs.id, 'fooitem')
    t.is(res.items[0].getChildText('entry'), 'Foo')
    t.is(res.items[1].name, 'item')
    t.is(res.items[1].attrs.id, 'baritem')
    t.is(res.items[1].getChildText('entry'), 'Bar')
    t.end()
  })
})

test.cb('items with RSM', t => {
  t.plan(17)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'get')
    const pubsub = stanza.getChild('pubsub')
    t.is(pubsub.attrs.xmlns, 'http://jabber.org/protocol/pubsub')
    const items = pubsub.getChild('items')
    t.is(items.attrs.node, 'foo')
    const rsm = pubsub.getChild('set')
    t.is(rsm.attrs.xmlns, 'http://jabber.org/protocol/rsm')
    t.is(rsm.getChildText('first'), 'first@time')
    t.is(rsm.getChildText('max'), '2')

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
          <set xmlns='http://jabber.org/protocol/rsm'>
            <first>first@time</first>
            <last>last@time</last>
            <count>2</count>
          </set>
        </pubsub>
      </iq>
    `)
  })

  t.context.plugin.items('foo', {first: 'first@time', max: 2})
  .then(res => {
    t.is(res.items.length, 2)
    t.is(res.items[0].name, 'item')
    t.is(res.items[0].attrs.id, 'fooitem')
    t.is(res.items[0].getChildText('entry'), 'Foo')
    t.is(res.items[1].name, 'item')
    t.is(res.items[1].attrs.id, 'baritem')
    t.is(res.items[1].getChildText('entry'), 'Bar')
    t.is(res.rsm.first, 'first@time')
    t.is(res.rsm.last, 'last@time')
    t.is(res.rsm.count, '2')
    t.end()
  })
})

test.cb('PEP events', t => {
  t.plan(7)
  const p1 = new Promise(resolve => {
    t.context.entity.on('item-published', ev => {
      t.is(ev.node, 'foo')
      t.is(ev.id, 'fooitem')
      t.is(ev.entry.name, 'entry')
      t.is(ev.entry.text(), 'Foo Bar')
      resolve()
    })
  })
  const p2 = new Promise(resolve => {
    t.context.entity.on('item-published:foo', ev => {
      t.is(ev.id, 'fooitem')
      t.is(ev.entry.name, 'entry')
      t.is(ev.entry.text(), 'Foo Bar')
      resolve()
    })
  })

  Promise.all([p1, p2]).then(t.end())

  t.context.fake`
    <message from='pubsub.foo'>
      <event xmlns='http://jabber.org/protocol/pubsub#event'>
        <items node='foo'>
          <item id='fooitem'>
            <entry>Foo Bar</entry>
          </item>
        </items>
      </event>
    </message>
  `.then()
})
