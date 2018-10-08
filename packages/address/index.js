'use strict'

const Address = require('./lib/Address')
const escaping = require('./lib/escaping')
const parse = require('./lib/parse')

function address(...args) {
  if (!args[1] && !args[2]) {
    return parse(...args)
  }
  return new Address(...args)
}

exports = module.exports = address.bind()
exports.jid = address
exports.JID = Address
exports.Address = Address
exports.equal = function(a, b) {
  return a.equals(b)
}
exports.detectEscape = escaping.detect
exports.escapeLocal = escaping.escape
exports.unescapeLocal = escaping.unescape
exports.parse = parse
