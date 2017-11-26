'use strict'

const test = require('ava')
const ConnectionTLS = require('./lib/Connection')

test('socketParameters()', t => {
  let params

  params = ConnectionTLS.prototype.socketParameters('xmpps://foo')
  t.is(params.port, 5223)

  params = ConnectionTLS.prototype.socketParameters('xmpps://foo:1234')
  t.is(params.port, 1234)

  params = ConnectionTLS.prototype.socketParameters('xmpp://foo')
  t.is(params, undefined)

  params = ConnectionTLS.prototype.socketParameters('xmpp://foo:1234')
  t.is(params, undefined)
})
