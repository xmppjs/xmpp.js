"use strict";

const Element = require("ltx/lib/Element");
const createElement = require("ltx/lib/createElement");
const Parser = require("./lib/Parser");
const {
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
} = require("ltx/lib/escape");
const XMLError = require("./lib/XMLError");

function xml(...args) {
  return createElement(...args);
}

module.exports = xml;

Object.assign(module.exports, {
  Element,
  createElement,
  Parser,
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
  XMLError,
});
