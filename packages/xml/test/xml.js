
import createElement from "ltx/lib/createElement.js";
import Element from "ltx/lib/Element.js";
import {
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
} from "ltx/lib/escape.js";

import Parser from "../lib/Parser.js";
import xml from "../index.js";

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
