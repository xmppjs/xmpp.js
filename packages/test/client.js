'use strict'

const {Client} = require('../client-core')
const JID = require('@xmpp/jid')
const mockSocket = require('./mockSocket')

module.exports = function client(entity = new Client()) {
  entity.socket = mockSocket()
  entity.jid = new JID('foo@bar/test')
  entity.domain = 'bar'
  return entity
}
