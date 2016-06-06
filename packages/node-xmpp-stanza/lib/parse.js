'use strict'

var Parser = require('./Parser')
var ltxParse = require('ltx').parse

module.exports = function parse (data) {
  return ltxParse(data, Parser)
}
