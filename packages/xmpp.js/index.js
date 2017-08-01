'use strict'

const Client = require('./lib/Client')
const {xml, jid} = require('@xmpp/client-core')

module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid
