'use strict';

var util = require('util'),
    Mechanism = require('./mechanism');

function Plain() {};

util.inherits(Plain, Mechanism);

Plain.prototype.name = 'PLAIN';

Plain.prototype.auth = function() {
    return this.authzid + '\0' +
        this.authcid + '\0' +
        this.password;
};

Plain.prototype.authServer = function(auth, client) {
    var params = auth.split('\x00');
    this.username = params[1];
    client.authenticate(this.username, params[2]);
};

Plain.prototype.match = function(options) {
    if (options.password) {
        return true;
    }
    return false;
};

module.exports = Plain;