'use strict'

module.exports = {
    // S2S
    Router: require('./lib/S2S/router'),

    // C2S
    C2SServer: require('./lib/C2S/TCP/server'),
    C2SStream: require('./lib/C2S/TCP/stream'),

    // C2S
    TCPServer: require('./lib/C2S/TCP/server'),
    TCPStream: require('./lib/C2S/TCP/stream'),

    // BOSH
    BOSHServer: require('./lib/C2S/BOSH/server'),

    // Websocket
    WebSocketServer: require('./lib/C2S/WebSocket/server'),

    // Component
    ComponentServer: require('./lib/component/server'),
    ComponentStream: require('./lib/component/stream'),

    // SASL
    auth: {
        AbstractMechanism: require('./lib/C2S/authentication/mechanism'),
        Plain: require('./lib/C2S/authentication/plain'),
        DigestMD5: require('./lib/C2S/authentication/digestmd5'),
        XOAuth2: require('./lib/C2S/authentication/xoauth2'),
        Anonymous: require('./lib/C2S/authentication/anonymous')
    },

    ltx: require('./lib/xmpp').core.ltx
}
