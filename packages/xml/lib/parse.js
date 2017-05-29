'use strict'

const Parser = require('./Parser')
const ltxParse = require('ltx').parse

module.exports = function parse(data) {
  return ltxParse(data, Parser)
}
