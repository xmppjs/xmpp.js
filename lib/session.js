'use strict'

var tls = require('tls')
var EventEmitter = require('events').EventEmitter
var core = require('node-xmpp-core')
var inherits = core.inherits
var Connection = core.Connection
var JID = core.JID
var SRV = core.SRV
var BOSHConnection = require('./bosh')
var WSConnection = require('./websockets')
var debug = require('debug')('xmpp:client:session')

function Session (opts) {
  EventEmitter.call(this)

  this.setOptions(opts)

  if (opts.websocket && opts.websocket.url) {
    debug('start websocket connection')
    this._setupWebsocketConnection(opts)
  } else if (opts.bosh && opts.bosh.url) {
    debug('start bosh connection')
    this._setupBoshConnection(opts)
  } else {
    debug('start socket connection')
    this._setupSocketConnection(opts)
  }
}

inherits(Session, EventEmitter)

Session.prototype._setupSocketConnection = function (opts) {
  var params = {
    xmlns: { '': opts.xmlns },
    streamAttrs: {
      version: '1.0',
      to: this.jid.domain
    },
    serialized: opts.serialized
  }
  for (var key in opts) {
    if (!(key in params)) {
      params[key] = opts[key]
    }
  }

  this.connection = new Connection(params)
  this._addConnectionListeners()

  if (opts.host) {
    this._socketConnectionToHost(opts)
  } else if (!SRV) {
    throw new Error('Cannot load SRV')
  } else {
    this._performSrvLookup(opts)
  }
}

Session.prototype._socketConnectionToHost = function (opts) {
  var _this = this

  if (opts.legacySSL) {
    this.connection.allowTLS = false
    this.connection.connect({
      socket: function () {
        return tls.connect(
          opts.port || 5223,
          opts.host,
          opts.credentials || {},
          function () {
            if (this.socket.authorized) {
              _this.emit('connect', this.socket)
            } else {
              _this.emit('error', 'unauthorized')
            }
          }.bind(this)
        )
      }
    })
  } else {
    if (opts.credentials) {
      this.connection.credentials = tls
        .createSecureContext(opts.credentials)
    }
    if (opts.disallowTLS) this.connection.allowTLS = false
    this.connection.listen({
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

Session.prototype._performSrvLookup = function (opts) {
  if (opts.legacySSL) {
    throw new Error('LegacySSL mode does not support DNS lookups')
  }
  if (opts.credentials) {
    this.connection.credentials = tls.createSecureContext(opts.credentials)
  }
  if (opts.disallowTLS) {
    this.connection.allowTLS = false
  }
  this.connection.listen({socket: SRV.connect({
    socket: opts.socket,
    services: ['_xmpp-client._tcp'],
    domain: this.jid.domain,
    defaultPort: 5222
  })})
}

Session.prototype._setupBoshConnection = function (opts) {
  this.connection = new BOSHConnection({
    jid: this.jid,
    bosh: opts.bosh
  })
  this._addConnectionListeners()
  this.connection.on('connected', function () {
    // Clients start <stream:stream>, servers reply
    if (this.connection.startStream) {
      this.connection.startStream()
    }
  }.bind(this))
}

Session.prototype._setupWebsocketConnection = function (opts) {
  this.connection = new WSConnection({
    jid: this.jid,
    websocket: opts.websocket
  })
  this._addConnectionListeners()
  this.connection.on('connected', function () {
    // Clients start <stream:stream>, servers reply
    if (this.connection.startStream) {
      this.connection.startStream()
    }
  }.bind(this))
}

Session.prototype.setOptions = function (opts) {
  this.jid = (typeof opts.jid === 'string') ? new JID(opts.jid) : opts.jid
  this.password = opts.password
  this.preferredSaslMechanism = opts.preferredSaslMechanism
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
}

Session.prototype._addConnectionListeners = function (con) {
  con = con || this.connection
  con.on('stanza', this.onStanza.bind(this))
  con.on('drain', this.emit.bind(this, 'drain'))
  con.on('end', this.emit.bind(this, 'end'))
  con.on('close', this.emit.bind(this, 'close'))
  con.on('error', this.emit.bind(this, 'error'))
  con.on('connect', this.emit.bind(this, 'connect'))
  con.on('reconnect', this.emit.bind(this, 'reconnect'))
  con.on('disconnect', this.emit.bind(this, 'disconnect'))
  if (con.startStream) {
    con.on('connect', function () {
      // Clients start <stream:stream>, servers reply
      con.startStream()
    })
    this.on('auth', function () {
      con.startStream()
    })
  }
}

Session.prototype.pause = function () {
  if (this.connection && this.connection.pause) {
    this.connection.pause()
  }
}

Session.prototype.resume = function () {
  if (this.connection && this.connection.resume) {
    this.connection.resume()
  }
}

Session.prototype.send = function (stanza) {
  return this.connection ? this.connection.send(stanza) : false
}

Session.prototype.end = function () {
  if (this.connection) {
    this.connection.end()
  }
}

Session.prototype.onStanza = function () {}

module.exports = Session
