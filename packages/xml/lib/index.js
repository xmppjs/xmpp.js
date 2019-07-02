'use strict'

const x = require('./x')
const Element = require('./Element')
const Parser = require('./Parser')
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
