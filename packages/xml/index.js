'use strict'

const tag = require('./lib/tag')

const Element = require('./lib/Element')
const createElement = require('./lib/createElement')
const Parser = require('./lib/Parser')
const parse = require('./lib/parse')
const {escapeXML, unescapeXML, escapeXMLText, unescapeXMLText} = require('ltx/lib/escape')

function xml(...args) {
  return tag(...args)
}

exports = module.exports = xml
exports.Element = Element

Object.assign(exports, {
  tag,
  Element,
  createElement,
  Parser,
  parse,
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
})
