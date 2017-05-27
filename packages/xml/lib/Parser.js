'use strict'

const inherits = require('inherits')
const createStanza = require('./createStanza')
const LtxParser = require('ltx').Parser

function Parser (options) {
  LtxParser.call(this, options)
}
inherits(Parser, LtxParser)

Parser.prototype.DefaultElement = createStanza

module.exports = Parser
