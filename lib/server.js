'use strict';

var Connection = require('node-xmpp-core').Connection
  , ltx = require('ltx')
  , util = require('util')
  , SRV = require('node-xmpp-core').SRV

var NS_SERVER = 'jabber:server'
var NS_DIALBACK = 'jabber:server:dialback'
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

/**
 * Dialback-specific events:
 * (1) dialbackKey(from, to, key)
 * (2) dialbackVerify(from, to, id, key)
 * (3) dialbackVerified(from, to, id, isValid)
 * (4) dialbackResult(from, to, isValid)
 */
function Server(socket) {
    Connection.call(this, socket)

    this.xmlns[''] = NS_SERVER
    this.xmlns.db = NS_DIALBACK
    this.xmppVersion = '1.0'

    this.on('rawStanza', function(stanza) {
        var key = stanza.getText()

        if (stanza.is('result', NS_DIALBACK)) {
            if (stanza.attrs.from && stanza.attrs.to &&
                stanza.attrs.type) {

                this.emit('dialbackResult',
                    stanza.attrs.from, stanza.attrs.to,
                    (stanza.attrs.type === 'valid')
                )

            } else if (stanza.attrs.from && stanza.attrs.to) {

                this.emit('dialbackKey',
                    stanza.attrs.from, stanza.attrs.to,
                    key
                )
            }
        } else if (stanza.is('verify', NS_DIALBACK)) {
            if (stanza.attrs.from && stanza.attrs.to &&
                stanza.attrs.id && stanza.attrs.type) {

                this.emit('dialbackVerified',
                    stanza.attrs.from,
                    stanza.attrs.to,
                    stanza.attrs.id,
                    (stanza.attrs.type === 'valid')
                )

            } else if (stanza.attrs.from && stanza.attrs.to && stanza.attrs.id) {

                this.emit('dialbackVerify',
                    stanza.attrs.from,
                    stanza.attrs.to,
                    stanza.attrs.id,
                    key
                )
            }
        } else {
            this.emit('stanza', stanza)
        }
    })
}
util.inherits(Server, Connection)

exports.dialbackKey = function(from, to, key) {
    return new ltx.Element('db:result', {
        to: to,
        from: from
    }).t(key)
}
exports.dialbackVerify = function(from, to, id, key) {
    return new ltx.Element('db:verify', {
        to: to,
        from: from,
        id: id
    }).t(key)
}
exports.dialbackVerified = function(from, to, id, isValid) {
    return new ltx.Element('db:verify', {
        to: to,
        from: from,
        id: id,
        type: isValid ? 'valid' : 'invalid'
    })
}

exports.dialbackResult = function(from, to, isValid) {
    return new ltx.Element('db:result', {
        to: to,
        from: from,
        type: isValid ? 'valid' : 'invalid'
    })
}

exports.IncomingServer = function(stream, credentials) {
    Server.call(this, stream)

    this.startParser()
    this.streamId = generateId()

    this.on('streamStart', function(streamAttrs) {
        if (streamAttrs.to &&
            credentials &&
            credentials.hasOwnProperty(streamAttrs.to)) {
            // TLS cert & key for this domain
            this.credentials = credentials[streamAttrs.to]
        }
        // No credentials means we cannot <starttls/> on the server
        // side. Unfortunately this is required for XMPP 1.0.
        if (!this.credentials) delete this.xmppVersion
        this.startStream()
    })
    this.on('rawStanza', function(stanza) {
        if (stanza.is('starttls', Connection.NS_XMPP_TLS)) {
            this.send(new ltx.Element('proceed', {
                xmlns: Connection.NS_XMPP_TLS
            }))
            this.setSecure(this.credentials, true)
        }
    })

    return this
}

util.inherits(exports.IncomingServer, Server)

exports.IncomingServer.prototype.startStream = function() {
    Server.prototype.startStream.call(this)

    if (this.xmppVersion === '1.0') {
        this.send('<stream:features>')
        if (this.credentials && !this.isSecure) {
            this.send('<starttls xmlns=\'' + Connection.NS_XMPP_TLS + '\'/>')
        }
        this.send('</stream:features>')
    }
}

exports.OutgoingServer = function(srcDomain, destDomain, credentials) {
    Server.call(this)

    this.streamTo = destDomain
    // For outgoing, we only need our own cert & key
    this.credentials = credentials
    // No credentials means we cannot <starttls/> on the server
    // side. Unfortunately this is required for XMPP 1.0.
    if (!this.credentials) delete this.xmppVersion

    this.socket.on('secure', function () {
        this.startStream()
    }.bind(this))
    this.on('streamStart', function(attrs) {
        if (attrs.version !== '1.0') {
            // Don't wait for <stream:features/>
            this.emit('auth', 'dialback')
        }
    })

    this.on('rawStanza', function(stanza) {
        if (stanza.is('features', Connection.NS_STREAM)) {
            var mechsEl
            if ((mechsEl = stanza.getChild('mechanisms', NS_XMPP_SASL))) {
                var mechs = mechsEl
                    .getChildren('mechanism', NS_XMPP_SASL)
                    .map(function(el) { return el.getText() })

                if (mechs.indexOf('EXTERNAL') >= 0) {
                    this.emit('auth', 'external')
                } else {
                    this.emit('auth', 'dialback')
                }
            } else {
                // No SASL mechanisms
                this.emit('auth', 'dialback')
            }
        }
    })

    var attempt = SRV.connect(
        this.socket,
        ['_xmpp-server._tcp', '_jabber._tcp'],
        destDomain,
        5269
    )
    attempt.on('connect', function() {
        this.startParser()
        this.startStream()
    }.bind(this))
    attempt.on('error', this.emit.bind(this, 'error'))
}

util.inherits(exports.OutgoingServer, Server)

function generateId() {
    var r = new Buffer(16)
    for (var i = 0; i < r.length; i++) {
        r[i] = 48 + Math.floor(Math.random() * 10)  // '0'..'9'
    }
    return r.toString()
}