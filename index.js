'use strict'

var BOSHServer = require('./lib/C2S/BOSH/Server')
  , TCPServer = require('./lib/C2S/TCP/Server')
  , TCPStream = require('./lib/C2S/TCP/Stream')
  , WebSocketServer = require('./lib/C2S/WebSocket/Server')

module.exports = {
    // S2S
    Router: require('./lib/S2S/Router'),

    // C2S
    C2SServer: TCPServer,
    C2SStream: TCPStream,
    C2S: {
        // TCP
        TCPServer: TCPServer,
        TCPStream: TCPStream,

        // BOSH
        BOSHServer: BOSHServer,

        // WebSocket
        WebSocketServer: WebSocketServer
    },

    // BOSH
    BOSHServer: BOSHServer,

    // Websocket
    WebSocketServer: WebSocketServer,

    // Component
    ComponentServer: require('./lib/component/Server'),
    ComponentStream: require('./lib/component/Stream'),

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
