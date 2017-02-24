'use strict'

const test = require('ava')
const xmpp = require('../../packages/client')
const debug = require('../../packages/debug')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

test.cb('client xmpps://', t => {
  t.plan(7)

  const entity = new xmpp.Client()
  debug(entity)

  entity.on('connect', () => {
    t.pass()
  })

  entity.once('open', (el) => {
    t.true(el instanceof xmpp.xml.Element)
  })

  entity.on('authenticate', auth => {
    t.is(typeof auth, 'function')
    auth('node-xmpp', 'foobar')
  })

  entity.on('online', (jid) => {
    t.true(jid instanceof xmpp.jid.JID)
    t.is(jid.bare().toString(), 'node-xmpp@localhost')
  })

  entity.start('xmpps://localhost:5223')
    .then((jid) => {
      t.true(jid instanceof xmpp.jid.JID)
      t.is(jid.bare().toString(), 'node-xmpp@localhost')
    })
    .then(() => {
      t.end()
    })
})
