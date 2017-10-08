'use strict'

const xml = require('@xmpp/xml')
const request = require('./request')

module.exports = function get(conn, handlers, child, ...args) {
  return request(conn, handlers, xml('iq', {type: 'get'}, child), ...args)
}
