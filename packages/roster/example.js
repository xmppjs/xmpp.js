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

const xmpp = client({
  service: 'ws://localhost:5280/xmpp-websocket',
  domain: 'localhost',
  username: 'username',
  password: 'password',
})
debug(xmpp, true)

// eslint-disable-next-line new-cap
xmpp.roster = Roster(xmpp)

const {promisify} = require('util')
const fs = require('fs')

const writeFile = promisify(fs.writeFile)
const stringify = require('@xmpp/xml/lib/stringify')
async function saveRoster(query) {
  return writeFile('/tmp/xmpp-roster', stringify(query))
}

const readFile = promisify(fs.readFile)
const parse = require('@xmpp/xml/lib/parse')
async function readRoster() {
  try {
    const str = await readFile('/tmp/xmpp-roster')
    return parse(str)
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return null
  }
}

function onRoster(roster) {
  console.log('version', roster.attrs.ver)
  console.log(
    roster.getChildren('item').map(item => {
      return item.attrs.jid
    })
  )
}

// function removeRosterItem(roster, jid) {
//   roster.
// }

;(async function main() {
  // The roster can be displayed before being connected
  let roster = await readRoster()
  if (roster) onRoster(roster)

  // xmpp.roster.on('delete', item => {
  //   const {ver} = item.parent.attrs
  // })

  // xmpp.roster.on('set', item => {
  //   const {ver} = item.parent.attrs
  // })

  // https://xmpp.org/rfcs/rfc6121.html#roster-login
  xmpp.on('online', async () => {
    const res = await xmpp.roster.get(roster ? roster.attrs.ver : null)
    if (res) {
      // Roster has changed
      roster = res
      onRoster(res)
      await saveRoster(res)
    } else {
      // Roster hasn't changed
    }

    await xmpp.send(xml('presence'))

    await xmpp.roster.set(xml('item', {jid: 'foo@bar'}))
  })

  await xmpp.start()
})().catch(console.error)
