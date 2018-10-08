'use strict'

const {Client} = require('../client-core')
const JID = require('@xmpp/address')

module.exports = function client(entity = new Client()) {
  entity.socket = {
    write(data, cb) {
      cb()
    },
  }
  entity.jid = new JID('foo@bar/test')
  entity.domain = 'bar'
  return entity
}
