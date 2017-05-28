'use strict'

const JID = require('./lib/JID')

module.exports = function createJID (a, b, c) {
  return new JID(a, b, c)
}
module.exports.JID = JID
module.exports.equal = function (a, b) {
  return a.equals(b)
}
module.exports.is = function (a) {
  return a instanceof JID
}
