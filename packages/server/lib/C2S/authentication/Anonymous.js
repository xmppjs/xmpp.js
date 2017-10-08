'use strict'

const crypto = require('crypto')
const util = require('util')
const Mechanism = require('./Mechanism')

class Anonymous extends Mechanism {
  extractSasl() {
    const user = crypto.randomBytes(16).toString('hex')
    return { username: user }
  }
}

Anonymous.prototype.name = 'ANONYMOUS'
Anonymous.id = 'ANONYMOUS'

module.exports = Anonymous
