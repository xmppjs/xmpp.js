'use strict';

var util = require('util')
  , crypto = require('crypto')
  , EventEmitter = require('events').EventEmitter
  , Connection = require('node-xmpp-core').Connection
  , JID = require('node-xmpp-core').JID
  , SRV = require('node-xmpp-core').SRV
  , ltx = require('ltx')

var NS_COMPONENT = 'jabber:component:accept'

/**
 * opts:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (required)
 *   port: Number (required)
 *   reconnect: Boolean (optional)
 */
function Component(opts) {
    EventEmitter.call(this)
    var self = this
    var conn = this.connection = new Connection()

    // proxy the fucntions of the connection instance
    for (var i in conn) {
        var fn = conn[i]
        // add to component instance if the function does not exist yet
        if ((typeof fn === 'function') && (self[i] == null)) {
            // wrap the function
            /* jshint -W083 */
            (function(i){
                self[i] = function(){
                    conn[i].apply(conn, arguments)
                }
            })(i)
        }
    }

    if (typeof otps.jid === 'string') {
        this.connection.jid = new JID(opts.jid)
    } else {
        this.connection.jid = opts.jid
    }
    this.connection.password = opts.password
    this.connection.xmlns[''] = NS_COMPONENT
    this.connection.streamTo = this.connection.jid.domain

    this.connection.on('stanza', this.onStanza.bind(this))
    this.connection.on('streamStart', this.onStreamStart.bind(this))
    this.connection.on('error', this.emit.bind(this, 'error'))

    var connect = function() {
        var attempt = SRV.connect(
            self.connection.socket,
            [],
            opts.host,
            opts.port
        )
        attempt.on('connect', function() {
            self.connection.startStream()
        })
        attempt.on('error', this.emit.bind(this, 'error'))
    }
    if (opts.reconnect) this.connection.reconnect = connect
    connect()
}

util.inherits(Component, EventEmitter)

Component.prototype.onStreamStart = function(streamAttrs) {
    var digest = sha1Hex(streamAttrs.id + this.connection.password)
    this.connection.send(new ltx.Element('handshake').t(digest))
}

Component.prototype.onStanza = function(stanza) {
    if (stanza.is('handshake')) {
        this.emit('online')
        return
    }
    this.emit('stanza', stanza)
}

// Component.prototype.send = function(stanza) {
//     this.connection.send(stanza);
// }
//
function sha1Hex(s) {
    var hash = crypto.createHash('sha1')
    hash.update(s)
    return hash.digest('hex')
}

Component.Component = Component
module.exports = Component
