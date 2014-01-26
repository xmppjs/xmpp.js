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
    var self = this
    this.connection = new Connection({
        setup: this._addConnectionListeners.bind(this),
        xmlns: { '': opts.xmlns },
        reconnect: opts.reconnect,
        socket: opts.socket,
        streamAttrs: {
            version: '1.0',
            to: this.jid.domain
        }
    })
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
        if (opts.host) {
            self._socketConnectionToHost(opts)
        } else if (!SRV) {
            throw 'Cannot load SRV'
        } else {
            self._performSrvLookup(opts)
        }
    }
}

Session.prototype._socketConnectionToHost = function(opts) {
    if (opts.legacySSL) {
        this.connection.allowTLS = false
        this.connection.listen({socket:function () {
            return tls.connect(
                opts.port || 5223,
                opts.host,
                opts.credentials || {}
            )
        }})
    } else {
        if (opts.credentials) {
            this.connection.credentials = crypto
                .createCredentials(opts.credentials)
        }
        if (opts.disallowTLS) this.connection.allowTLS = false
        this.connection.socket.connect(opts.port || 5222, opts.host)
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
        connection:  this.connection,
        services:    ['_xmpp-client._tcp'],
        domain:      this.jid.domain,
        defaultPort: 5222
    })})
}

Session.prototype._setupBoshConnection = function(opts) {
    this.connection = new BOSHConnection({
        setup: this._addConnectionListeners.bind(this),
        jid: this.jid,
        boshURL: opts.boshURL
    })
}

Session.prototype._setupWebsocketConnection = function(opts) {
    this.connection = new WebSockets.WSConnection({
        setup: this._addConnectionListeners.bind(this),
        jid: this.jid,
        websocketsURL: opts.websocketsURL
    })
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
