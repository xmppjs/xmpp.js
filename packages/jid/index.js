'use strict'

const JID = require('./lib/JID')
const escaping = require('./lib/escaping')
const parse = require('./lib/parse')

function jid(...args) {
  if (!args[1] && !args[2]) {
    return parse(...args)
  }

  return new JID(...args)
}

exports = module.exports = jid.bind()
exports.jid = jid
exports.JID = JID
exports.equal = function(a, b) {
  return a.equals(b)
}

exports.detectEscape = escaping.detect
exports.escapeLocal = escaping.escape
exports.unescapeLocal = escaping.unescape
exports.parse = parse
