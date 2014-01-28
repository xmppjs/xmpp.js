'use strict';

var randomstring = require('randomstring')

var util = require('util')
  , Mechanism = require('./mechanism')

function Anonymous() {}

util.inherits(Anonymous, Mechanism)

Anonymous.prototype.name = 'ANONYMOUS'
Anonymous.id = 'ANONYMOUS'

Anonymous.prototype.extractSasl = function() {
    var user = randomstring.generate()
    return { username: user }
}

module.exports = Anonymous
