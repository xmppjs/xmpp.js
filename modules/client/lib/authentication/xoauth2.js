'use strict'

var inherits = require('node-xmpp-core').inherits
var Mechanism = require('./mechanism')

/**
 * @see https://developers.google.com/talk/jep_extensions/oauth
 */
function XOAuth2 () {
  this.oauth2_auth = null
  this.authzid = null
}

inherits(XOAuth2, Mechanism)

XOAuth2.prototype.name = 'X-OAUTH2'
XOAuth2.prototype.NS_GOOGLE_AUTH = 'http://www.google.com/talk/protocol/auth'

XOAuth2.prototype.auth = function () {
  return '\0' + this.authzid + '\0' + this.oauth2_token
}

XOAuth2.prototype.authAttrs = function () {
  return {
    'auth:service': 'oauth2',
    'xmlns:auth': this.oauth2_auth
  }
}

XOAuth2.prototype.match = function (options) {
  return (options.oauth2_auth === XOAuth2.prototype.NS_GOOGLE_AUTH)
}

module.exports = XOAuth2
