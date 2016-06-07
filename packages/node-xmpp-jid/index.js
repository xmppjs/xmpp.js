'use strict'

var JID = require('./lib/JID')
var tag = require('./lib/tag')

module.exports = function createJID (a, b, c) {
  if (Array.isArray(a)) {
    return tag.apply(null, arguments)
  }

  return new JID(a, b, c)
}
module.exports.JID = JID
module.exports.tag = tag
module.exports.equal = function (a, b) {
  return a.equals(b)
}
module.exports.is = function (a) {
  return a instanceof JID
}
