const test = require('ava')
const xmpp = require('../../packages/client')

test.cb('client ws://', t => {
  t.plan(9)

  const entity = new xmpp.Client()

  entity.on('connect', () => {
    t.pass()
  })

  entity.once('open', (el) => {
    t.true(el instanceof xmpp.xml.Element)
  })

  entity.on('authenticate', auth => {
    t.is(typeof auth, 'function')
    auth('node-xmpp', 'foobar')
      .then(() => {
        t.pass('authenticated')
      })
  })

  entity.on('ready', () => {
    t.pass()
  })

  entity.on('online', (jid) => {
    t.true(jid instanceof xmpp.jid.JID)
    t.is(jid.bare().toString(), 'node-xmpp@localhost')
  })

  entity.start('ws://localhost:5280/xmpp-websocket')
    .then((jid) => {
      t.true(jid instanceof xmpp.jid.JID)
      t.is(jid.bare().toString(), 'node-xmpp@localhost')
    })
    .then(() => {
      t.end()
    })
})
