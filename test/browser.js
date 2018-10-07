'use strict'

const {JSDOM} = require('jsdom')
const fetch = require('node-fetch')
const {readFileSync} = require('fs')

const test = require('ava')
const {jid} = require('../packages/client')
const debug = require('../packages/debug')
const server = require('../server')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const username = 'client'
const password = 'foobar'
const credentials = {username, password}
const domain = 'localhost'
const JID = jid(username, domain).toString()
const service = 'ws://localhost:5280/xmpp-websocket'

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
  t.context = window.XMPP.client
  return server.restart()
})

test.serial('client ws://', t => {
  const xmpp = t.context({
    credentials,
    service,
  })
  debug(xmpp)

  return xmpp.start().then(id => {
    t.is(id.bare().toString(), JID)
  })
})
