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
  // service: 'ws://localhost:5280/xmpp-websocket',
  // domain: 'localhost',
  service: 'localhost',
  username: 'username',
  password: 'password',
})
debug(xmpp, true)

// eslint-disable-next-line new-cap
xmpp.roster = Roster(xmpp, {
  save,
  read,
})

const {promisify} = require('util')
const fs = require('fs')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const serialize = require('@xmpp/xml/lib/serialize')
async function save(roster, address) {
  return writeFile(
    `/tmp/${address}-roster.xml`,
    `<?xml version='1.0' encoding='utf-8'?>\n${serialize(roster, 2)}\n`
  )
}

const parse = require('@xmpp/xml/lib/parse')
async function read(address) {
  try {
    const str = await readFile(`/tmp/${address}-roster.xml`)
    return parse(str)
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return null
  }
}

;(async function main() {
  xmpp.on('online', async () => {
    const roster = await xmpp.roster.get()
    console.log(
      roster.getChildren('item').map(item => {
        return item.attrs.jid
      })
    )

    // await xmpp.send(xml('presence'))

    await xmpp.roster.set(
      xml('item', {
        jid: `${Math.random()
          .toString()
          .slice(2)}@foo`,
      })
    )
  })

  await xmpp.start()
})().catch(console.error)
