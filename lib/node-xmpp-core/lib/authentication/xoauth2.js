'use strict';

var util = require('util')
  , Mechanism = require('./mechanism')

var NS_GOOGLE_AUTH = 'http://www.google.com/talk/protocol/auth'

/**
 * @see https://developers.google.com/talk/jep_extensions/oauth
 */
/*jshint camelcase: false */
function XOAuth2() {

    this.oauth2_auth = null
    this.authzid = null
}

util.inherits(XOAuth2, Mechanism)

XOAuth2.prototype.name = 'X-OAUTH2'

XOAuth2.prototype.auth = function() {
    return '\0' + this.authzid + '\0' + this.oauth2_token
}

XOAuth2.prototype.authAttrs = function() {
    return {
        'auth:service': 'oauth2',
        'xmlns:auth': this.oauth2_auth
    }
}

XOAuth2.prototype.match = function(options) {
    return (options.oauth2_auth === NS_GOOGLE_AUTH)
}

XOAuth2.prototype.extractSasl = function(auth, callback) {
    var params = auth.split('\x00')
    var authRequest = {
        'username': params[1],
        'oauth_token': params[2]
    }
    callback(authRequest)
}

module.exports = XOAuth2