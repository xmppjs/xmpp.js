'use strict'

var crypto = require('crypto')

var util = require('util')
  , Mechanism = require('./Mechanism')

function Anonymous() {}

util.inherits(Anonymous, Mechanism)

Anonymous.prototype.name = 'ANONYMOUS'
Anonymous.id = 'ANONYMOUS'

Anonymous.prototype.extractSasl = function() {
    var user = crypto.randomBytes(16).toString('hex')
    return { username: user }
}

module.exports = Anonymous
