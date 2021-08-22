"use strict";

const test = require("ava");
const xml = require("..");
const createElement = require("ltx/lib/createElement");
const Element = require("ltx/lib/Element");
const Parser = require("../lib/Parser");
const {
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
} = require("ltx/lib/escape");

test("exports createElement", (t) => {
  t.is(xml.createElement, createElement);
});

test("exports Parser", (t) => {
  t.is(xml.Parser, Parser);
});

test("exports Element", (t) => {
  t.is(xml.Element, Element);
});

test("exports escape methods", (t) => {
  t.is(xml.escapeXML, escapeXML);
  t.is(xml.unescapeXML, unescapeXML);
  t.is(xml.escapeXMLText, escapeXMLText);
  t.is(xml.unescapeXMLText, unescapeXMLText);
});
