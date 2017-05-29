'use strict'

const test = require('ava')
const Connection = require('./lib/Connection')

test('socketParameters()', t => {
  let params

  params = Connection.prototype.socketParameters('xmpp://foo')
  t.is(params.port, 5222)

  params = Connection.prototype.socketParameters('xmpp://foo:1234')
  t.is(params.port, 1234)
})
