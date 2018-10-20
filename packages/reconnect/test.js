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

test('#reconnect', t => {
  const entity = new EventEmitter()
  const reconnect = _reconnect({entity})

  const options = (entity.options = {
    service: 'service',
    domain: 'domain',
    lang: 'lang',
  })

  entity.connect = service => {
    t.is(service, options.service)
    return Promise.resolve()
  }

  entity.open = ({domain, lang}) => {
    t.is(domain, options.domain)
    t.is(lang, options.lang)
    return Promise.resolve()
  }

  return reconnect.reconnect()
})
