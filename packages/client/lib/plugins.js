'use strict'

/* eslint-disable camelcase */

;[
  'stream-features',
  'bind',
  'sasl',
  'sasl-plain',
  'sasl-scram-sha-1',
  'websocket',
  'tcp',
  'reconnect',
  'starttls',
].forEach((pkg) => {
  module.exports[pkg] = require('@xmpp/plugins/' + pkg)
})
