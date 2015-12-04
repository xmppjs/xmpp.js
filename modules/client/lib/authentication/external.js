'use strict'

var inherits = require('node-xmpp-core').inherits
var Mechanism = require('./mechanism')

/**
 * @see http://xmpp.org/extensions/xep-0178.html
 */
function External () {}

inherits(External, Mechanism)

External.prototype.name = 'EXTERNAL'

External.prototype.auth = function () {
  return (this.authzid)
}

External.prototype.match = function (options) {
  if (options.credentials) return true
  return false
}

module.exports = External
