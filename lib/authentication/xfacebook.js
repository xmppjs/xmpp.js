'use strict';

var util = require('util')
  , Mechanism = require('./mechanism')
  , querystring = require('querystring')

/**
 * @see https://developers.facebook.com/docs/chat/#platauth
 */
function XFacebookPlatform() {}

util.inherits(XFacebookPlatform, Mechanism)

XFacebookPlatform.prototype.name = 'X-FACEBOOK-PLATFORM'

XFacebookPlatform.prototype.auth = function() {
    return ''
};

XFacebookPlatform.prototype.challenge = function(s) {
    var dict = querystring.parse(s)

    /*jshint camelcase: false */
    var response = {
        api_key: this.api_key,
        call_id: new Date().getTime(),
        method: dict.method,
        nonce: dict.nonce,
        access_token: this.access_token,
        v: '1.0'
    }

    return querystring.stringify(response)
};

XFacebookPlatform.prototype.match = function(options) {
    if (options.host === 'chat.facebook.com') return true
    return false
}

module.exports = XFacebookPlatform