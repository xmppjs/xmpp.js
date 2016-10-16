'use strict'

var inherits = require('inherits')
var createStanza = require('./createStanza')
var LtxParser = require('ltx').Parser

function Parser (options) {
  LtxParser.call(this, options)
}
inherits(Parser, LtxParser)

Parser.prototype.DefaultElement = createStanza

module.exports = Parser
