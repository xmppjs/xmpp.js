'use strict';

var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , Connection = require('./connection')
  , BOSH = require('./bosh')
  , WebSockets = require('./websockets')
  , JID = require('./jid').JID
  , tls = require('tls')
  , crypto = require('crypto')
  , SRV = require('./srv')

function Session(opts) {
    var self = this
    EventEmitter.call(this)

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

    if (opts.websocketsURL) {
        this.connection = new WebSockets.WSConnection(opts.websocketsURL)
        this.connection.on('connected', function() {
            if (self.connection.startStream)
                self.connection.startStream()
        })
    } else if (opts.boshURL) {
        this.connection = new BOSH.BOSHConnection({
            jid: this.jid,
            boshURL: opts.boshURL
        })
    } else {
        this.connection = new Connection.Connection({
            xmlns: { '': opts.xmlns },
            streamAttrs: {
                version: '1.0',
                to: this.jid.domain
            }
        })
        var connect = function() {
            if (opts.host) {
                self.connection.on('connect', function() {
                    if (self.connection.startStream)
                        self.connection.startStream()
                })

                if (opts.legacySSL) {
                    self.connection.allowTLS = false
                    self.connection.socket = tls.connect(
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
                        self.connection.credentials = crypto
                            .createCredentials(opts.credentials)
                    }
                    if (opts.disallowTLS) self.connection.allowTLS = false
                    self.connection.socket.connect(opts.port || 5222, opts.host)
                }
            } else if (!SRV) {
                throw 'Cannot load SRV'
            } else {
                if (opts.legacySSL)
                    throw 'LegacySSL mode does not support DNS lookups'
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
        }
        if (opts.reconnect) self.reconnect = connect
        connect()
    }
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

util.inherits(Session, EventEmitter)

Session.prototype.pause = function() {
    if (this.connection && this.connection.pause)
        this.connection.pause()
}

Session.prototype.resume = function() {
    if (this.connection && this.connection.resume)
        this.connection.resume()
}

Session.prototype.send = function(stanza) {
    if (this.connection)
        this.connection.send(stanza.root())
}

Session.prototype.end = function() {
    if (this.connection)
        this.connection.end()
}

Session.prototype.onStanza = function() {}

exports.Session = Session