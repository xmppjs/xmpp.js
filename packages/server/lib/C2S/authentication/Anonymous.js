'use strict'

const crypto = require('crypto')
const util = require('util')
const Mechanism = require('./Mechanism')

function Anonymous () {}

util.inherits(Anonymous, Mechanism)

Anonymous.prototype.name = 'ANONYMOUS'
Anonymous.id = 'ANONYMOUS'

Anonymous.prototype.extractSasl = function () {
  const user = crypto.randomBytes(16).toString('hex')
  return { username: user }
}

module.exports = Anonymous
