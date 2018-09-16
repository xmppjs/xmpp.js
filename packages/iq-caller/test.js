'use strict'

const test = require('ava')
const iqCallerPlugin = require('.')
const testPlugin = require('@xmpp/test/testPlugin')

test.cb('#get', t => {
  const {plugin, entity} = testPlugin(iqCallerPlugin)

  entity.send = el => {
    t.is(typeof el.attrs.id, 'string')
    delete el.attrs.id
    t.deepEqual(
      el,
      <iq type="get">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  plugin.get(<foo />)
})

test.cb('#set', t => {
  const {plugin, entity} = testPlugin(iqCallerPlugin)

  entity.send = el => {
    t.is(typeof el.attrs.id, 'string')
    delete el.attrs.id
    t.deepEqual(
      el,
      <iq type="set">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  plugin.set(<foo />)
})

test.cb('#request', t => {
  const {plugin, entity} = testPlugin(iqCallerPlugin)

  entity.send = el => {
    t.deepEqual(
      el,
      <iq type="get" id="foobar">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  plugin.request(
    <iq type="get" id="foobar">
      <foo />
    </iq>
  )
})

test.cb('#request with param as string', t => {
  const {plugin, entity} = testPlugin(iqCallerPlugin)

  entity.send = el => {
    t.deepEqual(
      el,
      <iq type="get" id="foobar" to="service">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  plugin.request(
    <iq type="get" id="foobar">
      <foo />
    </iq>,
    'service'
  )
})

test.cb('#request with id and to parameters', t => {
  const {plugin, entity} = testPlugin(iqCallerPlugin)

  entity.send = el => {
    t.deepEqual(
      el,
      <iq type="get" id="foobar" to="service">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  plugin.request(
    <iq type="get">
      <foo />
    </iq>,
    {to: 'service', id: 'foobar'}
  )
})

test('removes the handler if sending failed', t => {
  const {plugin, entity} = testPlugin(iqCallerPlugin)

  const error = new Error('foobar')

  entity.send = () => {
    return Promise.reject(error)
  }

  const promise = plugin.request(
    <iq type="get">
      <foo />
    </iq>
  )

  t.is(plugin.handlers.size, 1)

  return promise.catch(err => {
    t.is(err, error)
    t.is(plugin.handlers.size, 0)
  })
})
