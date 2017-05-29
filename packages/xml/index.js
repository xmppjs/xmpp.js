'use strict'

const ltx = require('ltx')
const tag = require('./lib/tag')

function xml(...args) {
  return tag(...args)
}

exports = module.exports = xml

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
