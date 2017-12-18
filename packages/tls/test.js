'use strict'

const test = require('ava')
const ConnectionTLS = require('./lib/Connection')

test('socketParameters()', t => {
  t.deepEqual(ConnectionTLS.prototype.socketParameters('xmpps://foo'), {
    port: 5223,
    host: 'foo',
  })

  t.deepEqual(ConnectionTLS.prototype.socketParameters('xmpps://foo:1234'), {
    port: 1234,
    host: 'foo',
  })

  t.deepEqual(ConnectionTLS.prototype.socketParameters('xmpp://foo'), undefined)

  t.deepEqual(
    ConnectionTLS.prototype.socketParameters('xmpp://foo:1234'),
    undefined
  )
})
