'use strict'

var Mechanism = require('./mechanism')
var inherits = require('node-xmpp-core').inherits

/**
 * @see http://tools.ietf.org/html/rfc4505
 * @see http://xmpp.org/extensions/xep-0175.html
 */
function Anonymous () {}

inherits(Anonymous, Mechanism)

Anonymous.prototype.name = 'ANONYMOUS'

Anonymous.prototype.auth = function () {
  return this.authzid
}

Anonymous.prototype.match = function () {
  return true
}

module.exports = Anonymous
