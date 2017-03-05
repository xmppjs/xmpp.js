'use strict'

const test = require('ava')
const {Client} = require('../../packages/client-tcp')
const debug = require('../../packages/debug')
const xml = require('../../packages/xml')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

test.cb('client-tcp xmpp://', t => {
  t.plan(4)

  const entity = new Client()
  debug(entity)

  entity.on('connect', () => {
    t.pass()
  })

  entity.once('open', (el) => {
    t.true(el instanceof xml.Element)
  })

  entity.connect('xmpp://localhost').then(() => {
    t.pass()
    return entity.open({domain: 'localhost'}).then((el) => {
      t.true(el instanceof xml.Element)
      t.end()
    })
  })
})
