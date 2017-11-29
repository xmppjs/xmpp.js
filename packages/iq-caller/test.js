'use strict'

const test = require('ava')
const iqCaller = require('.')
const {testPlugin} = require('@xmpp/test')

test.beforeEach(t => {
  t.context = testPlugin(iqCaller)
})

test.only('#get', t => {
  t.context.scheduleIncomingResult(<bar />)

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <foo />)
    }),
    t.context.plugin.get(<foo />).then(res => {
      t.deepEqual(res, <bar />)
    }),
  ])
})

test.cb('#get', t => {
  const {plugin, entity} = t.context

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
  const {plugin, entity} = t.context

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
  const {plugin, entity} = t.context

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
  const {plugin, entity} = t.context

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
  const {plugin, entity} = t.context

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
