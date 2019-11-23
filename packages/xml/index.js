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
const XMLError = require('./lib/XMLError')

function xml(...args) {
  return x(...args)
}

exports = module.exports = xml

Object.assign(exports, {
  x,
  Element,
  Parser,
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
  XMLError,
})
