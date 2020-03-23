"use strict";

const JID = require("./lib/JID");
const escaping = require("./lib/escaping");
const parse = require("./lib/parse");

function jid(...args) {
  if (!args[1] && !args[2]) {
    return parse(...args);
  }

  return new JID(...args);
}

module.exports = jid.bind();
module.exports.jid = jid;
module.exports.JID = JID;
module.exports.equal = function equal(a, b) {
  return a.equals(b);
};

module.exports.detectEscape = escaping.detect;
module.exports.escapeLocal = escaping.escape;
module.exports.unescapeLocal = escaping.unescape;
module.exports.parse = parse;
