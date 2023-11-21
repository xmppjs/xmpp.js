"use strict";

const XMPPError = require("@xmpp/error");

// https://xmpp.org/rfcs/rfc6120.html#sasl-errors

class SASLError extends XMPPError {
  constructor(...args) {
    super(...args);
    this.name = "SASLError";
  }
}

module.exports = SASLError;
