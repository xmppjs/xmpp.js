'use strict'

exports['stream-features'] = require('@xmpp/plugins/stream-features')
exports.bind = require('@xmpp/plugins/bind')
exports.sasl = require('@xmpp/plugins/sasl')
exports['sasl-plain'] = require('@xmpp/plugins/sasl-plain')
exports['sasl-anonymous'] = require('@xmpp/plugins/sasl-anonymous')
exports.websocket = require('@xmpp/plugins/websocket')
exports.tcp = require('@xmpp/plugins/tcp')
exports.tls = require('@xmpp/plugins/tls')
exports.reconnect = require('@xmpp/plugins/reconnect')
exports.starttls = require('@xmpp/plugins/starttls')
exports[
  'session-establishment'
] = require('@xmpp/plugins/session-establishment')
