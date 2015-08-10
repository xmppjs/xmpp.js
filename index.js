'use strict'

var BOSHServer = require('./lib/C2S/BOSH/Server')
  , TCPServer = require('./lib/C2S/TCP/Server')
  , C2SServer = require('./lib/C2S/Server')
  , C2SSession = require('./lib/C2S/Session')
  , WebSocketServer = require('./lib/C2S/WebSocket/Server')
  , ComponentServer = require('./lib/component/Server')
  , ComponentSession = require('./lib/component/Session')
  , core = require('node-xmpp-core')
  , util = require('util')

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

util._extend(module.exports, core)
