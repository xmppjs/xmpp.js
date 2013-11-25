'use strict';

var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , Connection = require('node-xmpp-core').Connection
  , BOSHConnection = require('./bosh')
  , WebSockets = require('./websockets')
  , JID = require('node-xmpp-core').JID
  , tls = require('tls')
  , crypto = require('crypto')
  , SRV = require('node-xmpp-core').SRV

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
    this._addConnectionListeners()
}

util.inherits(Session, EventEmitter)

Session.prototype._setupSocketConnection = function(opts) {
    var self = this
    this.connection = new Connection({
        xmlns: { '': opts.xmlns },
        streamAttrs: {
            version: '1.0',
            to: this.jid.domain
        }
    })
    var connect = function() {
        if (opts.host) {
            self._socketConnectionToHost(opts)
        } else if (!SRV) {
            throw 'Cannot load SRV'
        } else {
            self._performSrvLookup(opts)
        }
    }
    if (opts.reconnect) self.reconnect = connect
    connect()
}

Session.prototype._socketConnectionToHost = function(opts) {
    var self = this
    this.connection.on('connect', function() {
        if (self.connection.startStream)
            self.connection.startStream()
    })

    if (opts.legacySSL) {
        this.connection.allowTLS = false
        this.connection.socket = tls.connect(
            opts.port || 5223,
            opts.host,
            opts.credentials || {},
            function() {
                self.connection.setupStream()
                self.connection.startParser()
                self.connection.emit('connect')
            }
        )
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
    var self = this
    if (opts.legacySSL) {
        throw 'LegacySSL mode does not support DNS lookups'
    }
    if (opts.credentials)
        self.connection.credentials = crypto.createCredentials(opts.credentials)
    if (opts.disallowTLS)
        self.connection.allowTLS = false
    var attempt = SRV.connect(self.connection.socket,
        ['_xmpp-client._tcp'], self.jid.domain, 5222)
    attempt.addListener(
        'connect',
        function() {
            if (self.connection.startStream)
                self.connection.startStream()
        }
    )
    attempt.addListener('error', function(e) {
        self.emit('error', e)
    })
}

Session.prototype._setupBoshConnection = function(opts) {
    this.connection = new BOSHConnection({
        jid: this.jid,
        boshURL: opts.boshURL
    })
}

Session.prototype._setupWebsocketConnection = function(opts) {
    var self = this
    this.connection = new WebSockets.WSConnection(opts.websocketsURL)
    this.connection.on('connected', function() {
        if (self.connection.startStream)
            self.connection.startStream()
    })
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

Session.prototype._addConnectionListeners = function() {
    var self = this
    this.connection.addListener('stanza', this.onStanza.bind(this))
    this.connection.addListener('drain', this.emit.bind(this, 'drain'))

    this.connection.addListener('end', function() {
        self.emit('end')
    })
    this.connection.addListener('close', function() {
        self.emit('close')
    })

    this.connection.addListener('error', function(error) {
        self.emit('error', error)
    })
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
            this.connection.send(stanza.root())
        } else {
            this.connection.send(stanza.toString())
        }
    }
}

Session.prototype.end = function() {
    if (this.connection)
        this.connection.end()
}

Session.prototype.onStanza = function() {}

module.exports = Session
