'use strict';

var EventEmitter = require('events').EventEmitter
  , Connection = require('node-xmpp-core').Connection
  , JID = require('node-xmpp-core').JID
  , ltx = require('ltx')
  , util = require('util')
  , crypto = require('crypto')
  , SRV = require('node-xmpp-core').SRV

var NS_COMPONENT = 'jabber:component:accept'

/**
 * params:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (required)
 *   port: Number (required)
 *   reconnect: Boolean (optional)
 */
function Component(params) {
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

    if (typeof params.jid === 'string') {
        this.connection.jid = new JID(params.jid)
    } else {
        this.connection.jid = params.jid
    }
    this.connection.password = params.password
    this.connection.xmlns[''] = NS_COMPONENT
    this.connection.streamTo = this.connection.jid.domain

    this.connection.addListener('streamStart', function(streamAttrs) {
        self.onStreamStart(streamAttrs)
    })
    this.connection.addListener('stanza', function(stanza) {
        self.onStanza(stanza)
    })
    this.connection.addListener('error', function(e) {
        self.emit('error', e)
    })

    var connect = function() {
        var attempt = SRV.connect(
            self.connection.socket,
            [],
            params.host,
            params.port
        )
        attempt.addListener('connect', function() {
            self.connection.startStream()
        })
        attempt.addListener('error', function(e) {
            self.emit('error', e)
        })
    }
    if (params.reconnect) this.connection.reconnect = connect
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

module.exports = Component
