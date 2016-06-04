'use strict'

/* eslint-disable camelcase */

;[
  'client-stream-features',
  'client-authentication',
  'client-bind',
  'client-sasl',
  'client-sasl-anonymous',
  'client-sasl-digest-md5',
  'client-sasl-plain',
  'client-sasl-scram-sha-1',
  'client-legacy-authentication',
  'client-stream-management',
  'client-websocket',
  'client-tcp',
  'client-http',
  'client-alternative-connection-methods-http',
  'client-session-establishment'
].forEach((pkg) => {
  module.exports[pkg] = require('@xmpp/' + pkg)
})
