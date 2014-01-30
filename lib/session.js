'use strict';

var util = require('util')
  , tls = require('tls')
  , crypto = require('crypto')
  , EventEmitter = require('events').EventEmitter
  , Connection = require('node-xmpp-core').Connection
  , JID = require('node-xmpp-core').JID
  , SRV = require('node-xmpp-core').SRV
  , BOSHConnection = require('./bosh')
  , WebSockets = require('./websockets')

function Session(opts) {
    EventEmitter.call(this)

    this.setOptions(opts)

    if (opts.websocketsURL) {
        this._setupWebsocketConnection(opts)
    } else if (opts.boshURL) {
        this._setupBoshConnection(opts)
    } else {
        this._setupSocketConnection(opts)
    }
}

util.inherits(Session, EventEmitter)

Session.prototype._setupSocketConnection = function(opts) {
    this.connection = new Connection({
        xmlns: { '': opts.xmlns },
        reconnect: opts.reconnect,
        streamAttrs: {
            version: '1.0',
            to: this.jid.domain
        }
    })
    this._addConnectionListeners()

    if (opts.host) {
        this._socketConnectionToHost(opts)
    } else if (!SRV) {
        throw 'Cannot load SRV'
    } else {
        this._performSrvLookup(opts)
    }
}

Session.prototype._socketConnectionToHost = function(opts) {
    if (opts.legacySSL) {
        this.connection.allowTLS = false
        this.connection.connect({
            socket:function () {
                return tls.connect(
                        opts.port || 5223,
                        opts.host,
                        opts.credentials || {}
                    )
            }
        })
    } else {
        if (opts.credentials) {
            this.connection.credentials = crypto
                .createCredentials(opts.credentials)
        }
        if (opts.disallowTLS) this.connection.allowTLS = false
        this.connection.listen({
            socket:function () {
                var connect = function () {
                    this.socket.connect(opts.port || 5222, opts.host)
                }.bind(this)
                if (this.socket)
                    connect()
                else
                    process.nextTick(connect)
                return this.socket
            }
        })
    }
}

Session.prototype._performSrvLookup = function(opts) {
    if (opts.legacySSL) {
        throw 'LegacySSL mode does not support DNS lookups'
    }
    if (opts.credentials)
        this.connection.credentials = crypto.createCredentials(opts.credentials)
    if (opts.disallowTLS)
        this.connection.allowTLS = false
    this.connection.listen({socket:SRV.connect({
        socket:      opts.socket,
        services:    ['_xmpp-client._tcp'],
        domain:      this.jid.domain,
        defaultPort: 5222
    })})
}

Session.prototype._setupBoshConnection = function(opts) {
    this.connection = new BOSHConnection({
        jid: this.jid,
        boshURL: opts.boshURL
    })
    this._addConnectionListeners()
}

Session.prototype._setupWebsocketConnection = function(opts) {
    this.connection = new WebSockets.WSConnection({
        jid: this.jid,
        websocketsURL: opts.websocketsURL
    })
    this._addConnectionListeners()
    this.connection.on('connected', function() {
        if (this.connection.startStream)
            this.connection.startStream()
    }.bind(this))
}

Session.prototype.setOptions = function(opts) {
    /* jshint camelcase: false */
    this.jid = (typeof opts.jid === 'string') ? new JID(opts.jid) : opts.jid
    this.password = opts.password
    this.preferredSaslMechanism = opts.preferredSaslMechanism
    this.availableSaslMechanisms = []
    this.api_key = opts.api_key
    this.access_token = opts.access_token
    this.oauth2_token = opts.oauth2_token
    this.oauth2_auth = opts.oauth2_auth
    this.register = opts.register
    if (typeof opts.actAs === 'string') {
        this.actAs = new JID(opts.actAs)
    } else {
        this.actAs = opts.actAs
    }
    delete this.did_bind
    delete this.did_session
}

Session.prototype._addConnectionListeners = function (con) {
    con = con || this.connection
    con.on('connect', function () {
        // Clients start <stream:stream>, servers reply
        if (con.startStream)
            con.startStream()
    }.bind(this))
    con.on('stanza', this.onStanza.bind(this))
    con.on('drain', this.emit.bind(this, 'drain'))
    con.on('end', this.emit.bind(this, 'end'))
    con.on('close', this.emit.bind(this, 'close'))
    con.on('error', this.emit.bind(this, 'error'))
    con.on('connect', this.emit.bind(this, 'connect'))
    con.on('reconnect', this.emit.bind(this, 'reconnect'))
    con.on('disconnect', this.emit.bind(this, 'disconnect'))
}

Session.prototype.pause = function() {
    if (this.connection && this.connection.pause)
        this.connection.pause()
}

Session.prototype.resume = function() {
    if (this.connection && this.connection.resume)
        this.connection.resume()
}

Session.prototype.send = function(stanza) {
    if (this.connection) {
        if (stanza.root) {
            return this.connection.send(stanza.root())
        }
        return this.connection.send(stanza.toString())
    }
    return false
}

Session.prototype.end = function() {
    if (this.connection)
        this.connection.end()
}

Session.prototype.onStanza = function() {}

module.exports = Session
