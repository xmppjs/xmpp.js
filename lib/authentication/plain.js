'use strict';

var util = require('util')
  , Mechanism = require('./mechanism')
  , JID = require('node-xmpp-core').JID

function Plain() {}

util.inherits(Plain, Mechanism)

Plain.prototype.name = 'PLAIN'

Plain.prototype.auth = function() {
    return this.authzid + '\0' +
        this.authcid + '\0' +
        this.password;
}

Plain.prototype.match = function(options) {
    if (options.password) return true
    return false
}

Plain.prototype.manageAuth = function(server, stanza, callback) {
    this.extractSasl(new Buffer(stanza.getText(), 'base64').toString('utf8'), function(user) {
        server.emit('authenticate', user, function(error) {
            if(error)
                callback(error);
            else
                callback(user);
        });
    });
}

Plain.prototype.extractSasl = function(auth, callback) {
    var params = auth.split('\x00')
    var authRequest = {
        'username': params[1],
        'password': params[2]
    }
    callback(authRequest)
}

module.exports = Plain