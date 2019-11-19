/* eslint-disable node/no-extraneous-require */

/*
 * This is a complete example of roster management with persistent versioning (caching) support
 * it uses XML serialization and the filesystem for persistence but
 * you can use anything you like such as IndexedDB and JSON as long as the version (ver) is correct
 */

'use strict'

const {client, xml} = require('@xmpp/client')
const debug = require('@xmpp/debug')
const Roster = require('.') // @xmpp/roster
const Storage = require('./Storage') // @xmpp/storage

const xmpp = client({
  // service: 'ws://localhost:5280/xmpp-websocket',
  // domain: 'localhost',
  service: 'localhost',
  username: 'username',
  password: 'password',
})
debug(xmpp, true)

const storage = new Storage(xmpp)

// eslint-disable-next-line new-cap
xmpp.roster = Roster({...xmpp, storage})

xmpp.on('online', async () => {
  const roster = await xmpp.roster.get()
  console.log(
    roster.getChildren('item').map(item => {
      return item.attrs.jid
    })
  )

  await xmpp.send(xml('presence'))

  await xmpp.roster.set(
    xml('item', {
      jid: `${Math.random()
        .toString()
        .slice(2)}@foo`,
    })
  )
})

xmpp.start().catch(console.error)
