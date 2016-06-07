'use strict'

var JID = require('./JID')

module.exports = function tag (/* [literals], ...substitutions */) {
  var literals = arguments[0]
  var substitutions = Array.prototype.slice.call(arguments, 1)

  var str = ''

  for (var i = 0; i < substitutions.length; i++) {
    str += literals[i]
    str += substitutions[i]
  }
  str += literals[literals.length - 1]

  return new JID(str)
}
