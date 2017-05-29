'use strict'

const test = require('ava')
const xml = require('..')
const tag = require('../lib/tag')
const createElement = require('../lib/createElement')
const Element = require('../lib/Element')
const Parser = require('../lib/Parser')
const parse = require('../lib/parse')
const {escapeXML, unescapeXML, escapeXMLText, unescapeXMLText} = require('ltx/lib/escape')

test('exports tag', t => {
  t.is(xml.tag, tag)
})

test('exports createElement', t => {
  t.is(xml.createElement, createElement)
})

test('exports Parser', t => {
  t.is(xml.Parser, Parser)
})

test('exports parse', t => {
  t.is(xml.parse, parse)
})

test('exports Element', t => {
  t.is(xml.Element, Element)
})

test('exports ltx properties', t => {
  t.is(xml.escapeXML, escapeXML)
  t.is(xml.unescapeXML, unescapeXML)
  t.is(xml.escapeXMLText, escapeXMLText)
  t.is(xml.unescapeXMLText, unescapeXMLText)
})
