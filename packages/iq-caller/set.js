'use strict'

const xml = require('@xmpp/xml')
const request = require('./request')

module.exports = function set(conn, handlers, child, ...args) {
  return request(conn, handlers, xml('iq', {type: 'set'}, child), ...args)
}
