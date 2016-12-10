'use strict'

var tagString = require('ltx').tagString
var parse = require('./parse')

module.exports = function tag (/* [literals], ...substitutions */) {
  return parse(tagString.apply(null, arguments))
}
