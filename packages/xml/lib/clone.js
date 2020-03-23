"use strict";

// https://github.com/xmppjs/ltx/issues/
// FIXME
// probably need to prefix or unprefix the name too in some cases

const _clone = require("ltx/lib/clone");

module.exports = function clone(element) {
  const c = _clone(element);
  c.attrs.xmlns = element.getNS();
  return c;
};
