'use strict'

const x = require('./lib/x')
const Element = require('./lib/Element')
const Parser = require('./lib/Parser')
const {
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
} = require('ltx/lib/escape')

function xml(...args) {
  return x(...args)
}

// eslint-disable-next-line no-global-assign
exports = module.exports = xml

Object.assign(exports, {
  x,
  Element,
  Parser,
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
})
