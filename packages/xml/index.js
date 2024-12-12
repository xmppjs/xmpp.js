"use strict";

const Element = require("ltx/lib/Element.js");
const createElement = require("ltx/lib/createElement.js");
const Parser = require("./lib/Parser.js");
const {
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
} = require("ltx/lib/escape.js");
const XMLError = require("./lib/XMLError.js");

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
