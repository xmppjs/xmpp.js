'use strict'

const {Client} = require('../client-core')
const JID = require('../jid')

module.exports = function client() {
  const entity = new Client()
  entity.socket = {
    write(data, cb) {
      cb()
    },
  }
  entity.jid = new JID('foo@bar/test')
  return entity
}
