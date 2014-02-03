'use strict';

/**
 * Implements http://xmpp.org/extensions/xep-0220.html
 */
var util = require('util'),
    Connection = require('node-xmpp-core').Connection

var NS_SERVER = 'jabber:server',
    NS_DIALBACK = 'jabber:server:dialback';

var debug = require('debug')('server')

/**
 * Dialback-specific events:
 * (1) dialbackKey(from, to, key)
 * (2) dialbackVerify(from, to, id, key)
 * (3) dialbackVerified(from, to, id, isValid)
 * (4) dialbackResult(from, to, isValid)
 */
function Server(opts) {
    debug(opts)
    Connection.call(this, opts)

    this.xmlns[''] = NS_SERVER
    this.xmlns.db = NS_DIALBACK
    this.xmppVersion = '1.0'

}
util.inherits(Server, Connection)

Server.prototype.NS_SERVER = NS_SERVER;
Server.prototype.NS_DIALBACK = NS_DIALBACK;

Server.prototype.generateId = function () {
    var r = new Buffer(16)
    for (var i = 0; i < r.length; i++) {
        r[i] = 48 + Math.floor(Math.random() * 10) // '0'..'9'
    }
    return r.toString()
}

Server.prototype.handleDialback = function (stanza) {

    var key = stanza.getText()

    if (stanza.is('result', this.NS_DIALBACK)) {
        debug('result');
        if (stanza.attrs.from && stanza.attrs.to &&
            stanza.attrs.type) {
            debug('dialbackResult')
            this.emit('dialbackResult',
                stanza.attrs.from,
                stanza.attrs.to, (stanza.attrs.type === 'valid')
            )

        } else if (stanza.attrs.from && stanza.attrs.to) {
            debug('dialbackKey')
            this.emit('dialbackKey',
                stanza.attrs.from,
                stanza.attrs.to,
                key
            )
        }
    } else if (stanza.is('verify', this.NS_DIALBACK)) {
        debug('verifiy')
        if (stanza.attrs.from && stanza.attrs.to &&
            stanza.attrs.id && stanza.attrs.type) {
            debug('dialbackVerified')
            this.emit('dialbackVerified',
                stanza.attrs.from,
                stanza.attrs.to,
                stanza.attrs.id, (stanza.attrs.type === 'valid')
            )

        } else if (stanza.attrs.from && stanza.attrs.to && stanza.attrs.id) {
            debug('dialbackVerify')
            this.emit('dialbackVerify',
                stanza.attrs.from,
                stanza.attrs.to,
                stanza.attrs.id,
                key
            )
        }
    } else {
        debug('stanza unknown error');
        // this.emit('stanza', stanza)
    }
}

module.exports = Server;