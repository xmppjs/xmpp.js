'use strict'

const test = require('ava')
const Connection = require('./lib/Connection')

test('connectParameters()', t => {
  let params

  params = Connection.prototype.connectParameters({uri: 'xmpp://foo'})
  t.is(params.port, 5222)

  params = Connection.prototype.connectParameters({uri: 'xmpp://foo:1234'})
  t.is(params.port, 1234)
})
