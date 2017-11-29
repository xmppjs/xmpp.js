'use strict'

const {Client} = require('../client-core')
const JID = require('../jid')
const middleware = require('@xmpp/middleware')

module.exports = function client() {
  const entity = new Client()
  Object.assign(entity, middleware(entity))
  entity.socket = {
    write(data, cb) {
      cb()
    },
  }
  entity.jid = new JID('foo@bar/test')
  return entity
}
