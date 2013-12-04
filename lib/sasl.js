'use strict';

var Plain = require('./authentication/plain')

/**
 * What's available for server-side authentication (C2S)
 */
function availableMechanisms(availableMech) {
    // default methods
    var mechanisms = [Plain]
    if (availableMech)
        mechanisms = mechanisms.concat(availableMech)
    return mechanisms
}

exports.availableMechanisms = availableMechanisms