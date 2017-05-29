'use strict'

const JID = require('./lib/JID')

function jid(a, b, c) {
  return new JID(a, b, c)
}

exports = module.exports = jid.bind()
exports.jid = jid
exports.JID = JID
exports.equal = function (a, b) {
  return a.equals(b)
}
exports.is = function (a) {
  return a instanceof JID
}
