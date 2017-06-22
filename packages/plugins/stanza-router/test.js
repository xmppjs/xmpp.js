'use strict'

const test = require('ava')
const plugin = require('.')
const client = require('../../client-core')
const xml = require('@xmpp/xml')

test('name', t => {
  t.is(plugin.name, 'stanza-router')
})

test.cb('add', t => {
  const entity = client()
  const router = entity.plugin(plugin)

  router.add(element => element.is('presence'), () => {
    t.fail()
  })
  router.add(element => element.is('iq'), () => {
    t.end()
  })
  entity.emit('element', xml('iq'))
})

test.cb('remove', t => {
  t.plan(1)
  const entity = client()
  const router = entity.plugin(plugin)

  const match = element => element.is('iq')

  router.add(match, () => {
    t.pass()
    router.remove(match)
    entity.emit('element', xml('iq'))
    t.end()
  })

  entity.emit('element', xml('iq'))
})
