"use strict";

const xml = require("..");
const createElement = require("ltx/lib/createElement.js");
const Element = require("ltx/lib/Element.js");
const Parser = require("../lib/Parser.js");
const {
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
} = require("ltx/lib/escape.js");

test("exports createElement", () => {
  expect(xml.createElement).toBe(createElement);
});

test("exports Parser", () => {
  expect(xml.Parser).toBe(Parser);
});

test("exports Element", () => {
  expect(xml.Element).toBe(Element);
});

test("exports escape methods", () => {
  expect(xml.escapeXML).toBe(escapeXML);
  expect(xml.unescapeXML).toBe(unescapeXML);
  expect(xml.escapeXMLText).toBe(escapeXMLText);
  expect(xml.unescapeXMLText).toBe(unescapeXMLText);
});
