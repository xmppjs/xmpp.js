'use strict';

var util = require('util')
  , Mechanism = require('./mechanism')

function Anonymous() {}

util.inherits(Anonymous, Mechanism)

Anonymous.prototype.name = 'ANONYMOUS'
Anonymous.id = 'ANONYMOUS'

Anonymous.prototype.extractSasl = function() {
    return true
}

module.exports = Anonymous
