/* eslint-disable node/no-extraneous-require */

/*
 * This is a complete example of roster management with persistent versioning (caching) support
 * it uses XML serialization and the filesystem for persistence but
 * you can use anything you like such as IndexedDB and JSON as long as the version (ver) is correct
 */

'use strict'

const {client} = require('@xmpp/client')
const debug = require('@xmpp/debug')
const Roster = require('.') // @xmpp/roster

const xmpp = client({
  service: 'ws://localhost:5280/xmpp-websocket',
  domain: 'localhost',
  username: 'username',
  password: 'password',
})
debug(xmpp, true)

// eslint-disable-next-line new-cap
xmpp.roster = Roster(xmpp)

xmpp.roster.on('delete', item => {
  console.log('delete', item.attrs.jid)
})

xmpp.roster.on('set', item => {
  console.log('set', item.toString())
})
;(async function main() {
  // https://xmpp.org/rfcs/rfc6121.html#roster-login
  xmpp.on('online', async () => {
    await xmpp.roster.get()

    // await xmpp.send(xml('presence'))
  })

  await xmpp.start()
})().catch(console.error)
