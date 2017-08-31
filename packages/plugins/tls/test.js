'use strict'

const test = require('ava')
const ConnectionTLS = require('./lib/Connection')

test('connectParameters()', t => {
  let params

  params = ConnectionTLS.prototype.connectParameters({uri: 'xmpps://foo'})
  t.is(params.port, 5223)

  params = ConnectionTLS.prototype.connectParameters({uri: 'xmpps://foo:1234'})
  t.is(params.port, 1234)

  params = ConnectionTLS.prototype.connectParameters({uri: 'xmpp://foo'})
  t.is(params, undefined)

  params = ConnectionTLS.prototype.connectParameters({uri: 'xmpp://foo:1234'})
  t.is(params, undefined)
})
