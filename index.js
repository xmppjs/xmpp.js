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
    var conn = this.connection = new Connection({
        setup: this._addConnectionListeners.bind(this),
        reconnect: opts.reconnect,
        socket: opts.socket,
    })

    // FIXME WTF is this? why? :cry:
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

    this.connection.on('connect', function () {
        if (this !== self.connection) return
        // Clients start <stream:stream>, servers reply
        if (self.connection.startStream)
            self.connection.startStream()
    })

    if (opts.reconnect)
        this.connection.on('connection', connect)
    return connect()

    function connect() {
        self.connection.listen({socket:SRV.connect({
            connection:  self.connection,
            services:    [],
            domain:      opts.host,
            defaultPort: opts.port
        })})
    }
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

Component.prototype._addConnectionListeners = function (con) {
    con.on('streamStart', this.onStreamStart.bind(this))
    con.on('stanza', this.onStanza.bind(this))
    con.on('drain', this.emit.bind(this, 'drain'))
    con.on('data', this.emit.bind(this, 'data'))
    con.on('end', this.emit.bind(this, 'end'))
    con.on('close', this.emit.bind(this, 'close'))
    con.on('error', this.emit.bind(this, 'error'))
    con.on('connect', this.emit.bind(this, 'connect'))
    con.on('reconnect', this.emit.bind(this, 'reconnect'))
    con.on('disconnect', this.emit.bind(this, 'disconnect'))
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
