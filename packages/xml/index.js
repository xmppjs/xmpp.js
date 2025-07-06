import Element from "ltx/lib/Element.js";
import createElement from "ltx/lib/createElement.js";
import {
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
} from "ltx/lib/escape.js";

import Parser from "./lib/Parser.js";
import XMLError from "./lib/XMLError.js";

export default function xml(...args) {
  return createElement(...args);
}

Object.assign(xml, {
  Element,
  createElement,
  Parser,
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
  XMLError,
  xml,
});

export {
  Element,
  createElement,
  Parser,
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
  XMLError,
  xml,
};
