'use strict'

const JID = require('./JID')
const escaping = require('./escaping')
const parse = require('./parse')

function jid(...args) {
  if (!args[1] && !args[2]) {
    return parse(...args)
  }

  return new JID(...args)
}

// eslint-disable-next-line no-global-assign
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
