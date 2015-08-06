'use strict'

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , core = require('../xmpp').core
  , tls = require('tls')
  , SRV = core.SRV
  , Connection = core.Connection
  , debug = require('debug')('xmpp:client:TCP')

function TCPConnection(opts) {
    EventEmitter.call(this)

    this.jid = opts.jid

    var params = {
        xmlns: {'': opts.xmlns },
        streamAttrs: {
            version: '1.0',
            to: this.jid.domain
        },
        serialized: opts.serialized
    }
    for (var key in opts) {
        if (!(key in params))
            params[key] = opts[key]
    }

    var socket = this.socket = new Connection(params)
    socket.on('stanza', this.onStanza.bind(this))
    socket.on('connect', this.onconnect.bind(this))
    socket.on('close', this.onclose.bind(this))
    socket.on('end', this.emit.bind(this, 'end'))
    socket.on('error', this.emit.bind(this, 'error'))
    socket.on('reconnect', this.emit.bind(this, 'reconnect'))

    if (opts.host) {
        this._socketConnectionToHost(opts)
    } else if (!SRV) {
        throw 'Cannot load SRV'
    } else {
        this._performSrvLookup(opts)
    }
}

util.inherits(TCPConnection, EventEmitter)

TCPConnection.prototype.maxStanzaSize = 65535
TCPConnection.prototype.xmppVersion = '1.0'

TCPConnection.prototype.onStanza = function(stanza) {
    if (stanza.is('error', Connection.NS_STREAM)) {
        /* TODO: extract error text */
        this.emit('error', stanza)
    } else {
        this.emit('stanza', stanza)
    }
}

TCPConnection.prototype.onconnect = function() {
    this.emit('connected')
}

TCPConnection.prototype.send = function(stanza) {
    if (stanza.root) stanza = stanza.root()
    debug('output', stanza.toString())
    this.socket.send(stanza)
}

TCPConnection.prototype.onclose = function() {
    this.emit('disconnect')
    this.emit('close')
}

TCPConnection.prototype.end = function() {
    this.emit('disconnect')
    this.emit('end')
    if (this.socket) this.socket.end()
}

TCPConnection.prototype.startParser = function() {
    debug('start parser')
    this.socket.startParser()
}

TCPConnection.prototype.stopParser = function() {
    debug('stop parser')
    this.socket.stopParser()
}

TCPConnection.prototype.startStream = function() {
    debug('start stream')
    this.socket.startStream()
}

TCPConnection.prototype._performSrvLookup = function(opts) {
    if (opts.legacySSL) {
        throw 'LegacySSL mode does not support DNS lookups'
    }
    if (opts.credentials)
        this.socket.credentials = tls.createSecureContext(opts.credentials)
    if (opts.disallowTLS)
        this.socket.allowTLS = false
    this.socket.listen({socket:SRV.connect({
        socket:      opts.socket,
        services:    ['_xmpp-client._tcp'],
        domain:      this.jid.domain,
        defaultPort: 5222
    })})
}

TCPConnection.prototype._socketConnectionToHost = function(opts) {
    if (opts.legacySSL) {
        this.socket.allowTLS = false
        this.socket.connect({
            socket:function () {
                return tls.connect(
                    opts.port || 5223,
                    opts.host,
                    opts.credentials || {},
                    function() {
                        if (this.socket.authorized)
                            this.emit('connect', this.socket)
                        else
                            this.emit('error', 'unauthorized')
                    }.bind(this)
                )
            }
        })
    } else {
        if (opts.credentials) {
            this.socket.credentials = tls
                .createSecureContext(opts.credentials)
        }
        if (opts.disallowTLS) this.socket.allowTLS = false
        this.socket.listen({
            socket: function () {
                // wait for connect event listeners
                process.nextTick(function () {
                    this.socket.connect(opts.port || 5222, opts.host)
                }.bind(this))
                var socket = opts.socket
                opts.socket = null
                return socket // maybe create new socket
            }
        })
    }
}

module.exports = TCPConnection
