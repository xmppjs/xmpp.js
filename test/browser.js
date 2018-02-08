'use strict'

const {JSDOM} = require('jsdom')
const fetch = require('node-fetch')
const {readFileSync} = require('fs')

const test = require('ava')
const {jid} = require('../packages/client')
const debug = require('../packages/debug')
const server = require('../server')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const USERNAME = 'client'
const PASSWORD = 'foobar'
const domain = 'localhost'
const JID = jid(USERNAME, domain).toString()

const xmppjs = readFileSync('./packages/client/dist/xmpp.js', {
  encoding: 'utf-8',
})

test.beforeEach(t => {
  const {window} = new JSDOM(``, {runScripts: 'dangerously'})
  window.fetch = fetch
  const {document} = window
  const scriptEl = document.createElement('script')
  scriptEl.textContent = xmppjs
  document.body.appendChild(scriptEl)
  const {xmpp} = window
  t.context = xmpp.xmpp
  return server.restart()
})

test('client ws://', t => {
  const {client} = t.context()
  debug(client)

  client.handle('authenticate', auth => {
    t.is(typeof auth, 'function')
    return auth(USERNAME, PASSWORD)
  })

  return client.start('ws://localhost:5280/xmpp-websocket').then(id => {
    t.is(id.bare().toString(), JID)
  })
})
