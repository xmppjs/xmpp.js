'use strict'

var JID = require('./lib/JID')

module.exports = JID
module.exports.JID = JID
module.exports.equal = function (a, b) {
  return a.equals(b)
}
