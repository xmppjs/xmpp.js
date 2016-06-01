'use strict'

/**
 * Each implemented mechanism offers multiple methods
 * - name : name of the auth method
 * - auth :
 * - match: checks if the client has enough options to
 *          offer this mechanis to xmpp servers
 * - authServer: takes a stanza and extracts the information
 */

var inherits = require('node-xmpp-core').inherits
var EventEmitter = require('events').EventEmitter

// Mechanisms
function Mechanism () {}

inherits(Mechanism, EventEmitter)

Mechanism.prototype.authAttrs = function () {
  return {}
}

module.exports = Mechanism
