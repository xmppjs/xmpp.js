'use strict';

var util = require('util')
  , Mechanism = require('./mechanism')

/**
 * @see https://developers.google.com/talk/jep_extensions/oauth
 */
function XOAuth2() {

}

util.inherits(XOAuth2, Mechanism)

XOAuth2.prototype.name = 'X-OAUTH2'

XOAuth2.prototype.extractSasl = function(auth, callback) {
    var params = auth.split('\x00')
    var authRequest = {
        'jid': params[1],
        'oauth_token': params[2]
    }
    callback(authRequest)
}

module.exports = XOAuth2