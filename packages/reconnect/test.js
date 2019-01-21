'use strict'

const test = require('ava')
const _reconnect = require('.')
const EventEmitter = require('events')

test('it schedule a reconnect when disconnect is emitted', t => {
  const entity = new EventEmitter()
  const reconnect = _reconnect({entity})

  reconnect.scheduleReconnect = () => {
    t.pass()
  }

  entity.emit('disconnect')
})

test('#reconnect', async t => {
  const entity = new EventEmitter()
  const reconnect = _reconnect({entity})

  const options = (entity.options = {
    service: 'service',
    lang: 'lang',
    domain: 'domain',
  })

  entity.connect = service => {
    t.is(service, options.service)
  }

  entity.open = ({domain, lang}) => {
    t.is(domain, options.domain)
    t.is(lang, options.lang)
  }

  await reconnect.reconnect()
})
