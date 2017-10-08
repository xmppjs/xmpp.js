'use strict'

const BOSHServer = require('./lib/C2S/BOSH/Server')
const TCPServer = require('./lib/C2S/TCP/Server')
const C2SServer = require('./lib/C2S/Server')
const C2SSession = require('./lib/C2S/Session')
const WebSocketServer = require('./lib/C2S/WebSocket/Server')
const ComponentServer = require('./lib/component/Server')
const ComponentSession = require('./lib/component/Session')
const core = require('node-xmpp-core')

module.exports = {
  _Server: require('./lib/Server'),

  // S2S
  Router: require('./lib/S2S/Router'),

  // C2S
  C2S: {
    _Server: C2SServer,
    _Session: C2SSession,

    // TCP
    TCPServer,

    // BOSH
    BOSHServer,
    _BOSHSocket: require('./lib/C2S/BOSH/Socket'),
    _BOSHServer: require('./lib/C2S/BOSH/BOSHServer'),

    // WebSocket
    WebSocketServer,
    _WebSocketSocket: require('./lib/C2S/WebSocket/Socket'),
  },
  C2SServer: TCPServer,
  C2SStream: C2SSession,
  BOSHServer,
  WebSocketServer,

  // Component
  component: {
    Server: ComponentServer,
    Session: ComponentSession,
  },
  ComponentServer,
  ComponentStream: ComponentSession,

  // SASL
  auth: {
    AbstractMechanism: require('./lib/C2S/authentication/Mechanism'),
    Mechanism: require('./lib/C2S/authentication/Mechanism'),
    Plain: require('./lib/C2S/authentication/Plain'),
    DigestMD5: require('./lib/C2S/authentication/DigestMD5'),
    XOAuth2: require('./lib/C2S/authentication/XOAuth2'),
    Anonymous: require('./lib/C2S/authentication/Anonymous'),
  },
}

core.exportCoreUtils(module.exports)
