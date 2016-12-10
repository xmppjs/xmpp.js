'use strict'

var ltx = require('ltx')
var tag = require('./lib/tag')

exports = module.exports = function xml () {
  return tag.apply(null, arguments)
}

Object.assign(exports, ltx)

exports.IQ = require('./lib/IQ')
exports.Message = require('./lib/Message')
exports.Presence = require('./lib/Presence')

exports.Stanza = require('./lib/Stanza')
exports.createStanza = require('./lib/createStanza')

exports.parse = require('./lib/parse')
exports.Parser = require('./lib/Parser')
exports.tag = require('./lib/tag')

exports.ltx = ltx
