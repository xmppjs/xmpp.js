'use strict';

var util = require('util')
  , Mechanism = require('./mechanism')

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
            callback(error, user);
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