'use strict';

/**
 * Implements http://xmpp.org/extensions/xep-0220.html
 */
var util = require('util')
  , rack = require('hat').rack()
  , Connection = require('node-xmpp-core').Connection
  , debug = require('debug')('xmpp:s2s:server')

var NS_SERVER = 'jabber:server'
  , NS_DIALBACK = 'jabber:server:dialback'

/**
 * Dialback-specific events:
 * (1) dialbackKey(from, to, key)
 * (2) dialbackVerify(from, to, id, key)
 * (3) dialbackVerified(from, to, id, isValid)
 * (4) dialbackResult(from, to, isValid)
 */
function Server(opts) {
    Connection.call(this, opts)

    this.xmlns[''] = NS_SERVER
    this.xmlns.db = NS_DIALBACK
    this.xmppVersion = '1.0'

}
util.inherits(Server, Connection)

Server.prototype.NS_SERVER = NS_SERVER
Server.prototype.NS_DIALBACK = NS_DIALBACK

Server.prototype.generateId = function () {
    return rack()
}

Server.prototype.handleDialback = function (stanza) {

    var key = stanza.getText()

    if (stanza.is('result', this.NS_DIALBACK)) {
        if (stanza.attrs.from && stanza.attrs.to &&
            stanza.attrs.type) {
            debug('dialback result')
            this.emit('dialbackResult',
                stanza.attrs.from,
                stanza.attrs.to, (stanza.attrs.type === 'valid')
            )

        } else if (stanza.attrs.from && stanza.attrs.to) {
            debug('dialback key')
            this.emit('dialbackKey',
                stanza.attrs.from,
                stanza.attrs.to,
                key
            )
        }
    } else if (stanza.is('verify', this.NS_DIALBACK)) {
        if (stanza.attrs.from && stanza.attrs.to &&
            stanza.attrs.id && stanza.attrs.type) {
            debug('dialback verified')
            this.emit('dialbackVerified',
                stanza.attrs.from,
                stanza.attrs.to,
                stanza.attrs.id, (stanza.attrs.type === 'valid')
            )

        } else if (stanza.attrs.from && stanza.attrs.to && stanza.attrs.id) {
            debug('dialback verify')
            this.emit('dialbackVerify',
                stanza.attrs.from,
                stanza.attrs.to,
                stanza.attrs.id,
                key
            )
        }
    } else {
        debug('stanza unknown error' + stanza.toString())
        // this.emit('stanza', stanza)
    }
}

module.exports = Server
