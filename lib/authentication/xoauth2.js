'use strict';

var util = require('util'),
    Mechanism = require('./mechanism');

/**
 * @see https://developers.google.com/talk/jep_extensions/oauth
 */
function XOAuth2() {}
util.inherits(XOAuth2, Mechanism);

XOAuth2.prototype.name = 'X-OAUTH2';

XOAuth2.prototype.auth = function() {
    /*jshint camelcase: false */
    return '\0' + this.authzid + '\0' + this.oauth2_token;
};

XOAuth2.prototype.authServer = function(auth, client) {
    var params = auth.split('\x00');
    this.username = params[1];
    client.authenticate(this.username, params[2]);
};

XOAuth2.prototype.authAttrs = function() {
    return {
        'auth:service': 'oauth2',
        /*jshint camelcase: false */
        'xmlns:auth': this.oauth2_auth
    };
};

XOAuth2.prototype.match = function(options) {
    if (options.oauth2_auth === 'http://www.google.com/talk/protocol/auth') {
        return true;
    }
    return false;
};

XOAuth2.prototype.authServer = function(auth, client) {
    var params = auth.split('\x00');
    client.authenticate(params[1], params[2]);
};

module.exports = XOAuth2;