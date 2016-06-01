'use strict'

var BOSHServer = require('./lib/C2S/BOSH/Server')
var TCPServer = require('./lib/C2S/TCP/Server')
var C2SServer = require('./lib/C2S/Server')
var C2SSession = require('./lib/C2S/Session')
var WebSocketServer = require('./lib/C2S/WebSocket/Server')
var ComponentServer = require('./lib/component/Server')
var ComponentSession = require('./lib/component/Session')
var core = require('node-xmpp-core')

module.exports = {
  _Server: require('./lib/Server'),

  // S2S
  Router: require('./lib/S2S/Router'),

  // C2S
  C2S: {
    _Server: C2SServer,
    _Session: C2SSession,

    // TCP
    TCPServer: TCPServer,

    // BOSH
    BOSHServer: BOSHServer,
    _BOSHSocket: require('./lib/C2S/BOSH/Socket'),
    _BOSHServer: require('./lib/C2S/BOSH/BOSHServer'),

    // WebSocket
    WebSocketServer: WebSocketServer,
    _WebSocketSocket: require('./lib/C2S/WebSocket/Socket')
  },
  C2SServer: TCPServer,
  C2SStream: C2SSession,
  BOSHServer: BOSHServer,
  WebSocketServer: WebSocketServer,

  // Component
  component: {
    Server: ComponentServer,
    Session: ComponentSession
  },
  ComponentServer: ComponentServer,
  ComponentStream: ComponentSession,

  // SASL
  auth: {
    AbstractMechanism: require('./lib/C2S/authentication/Mechanism'),
    Mechanism: require('./lib/C2S/authentication/Mechanism'),
    Plain: require('./lib/C2S/authentication/Plain'),
    DigestMD5: require('./lib/C2S/authentication/DigestMD5'),
    XOAuth2: require('./lib/C2S/authentication/XOAuth2'),
    Anonymous: require('./lib/C2S/authentication/Anonymous')
  }
}

core.exportCoreUtils(module.exports)
