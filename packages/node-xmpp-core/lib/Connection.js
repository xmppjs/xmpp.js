'use strict'

var net = require('net')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var Element = require('@xmpp/xml').Element
var reconnect = require('reconnect-core')
var StreamParser = require('@xmpp/streamparser')
var starttls = require('node-xmpp-tls-connect')
var debug = require('debug')('xmpp:connection')
var assign = require('lodash.assign')

var NS_XMPP_TLS = 'urn:ietf:params:xml:ns:xmpp-tls'
var NS_STREAM = 'http://etherx.jabber.org/streams'
var NS_XMPP_STREAMS = 'urn:ietf:params:xml:ns:xmpp-streams'

var INITIAL_RECONNECT_DELAY = 1e3
var MAX_RECONNECT_DELAY = 30e3

var STREAM_OPEN = 'stream:stream'
var STREAM_CLOSE = '</stream:stream>'

function defaultInjection (emitter, opts) {
  // clone opts
  var options = assign({}, opts)

  // add computed options
  options.initialDelay = (opts && (opts.initialReconnectDelay ||
    opts.reconnectDelay)) || INITIAL_RECONNECT_DELAY
  options.maxDelay = (opts && opts.maxReconnectDelay) || MAX_RECONNECT_DELAY
  options.immediate = opts && opts.socket && (typeof opts.socket !== 'function')
  options.type = opts && opts.delayType
  options.emitter = emitter

  // return calculated options
  return options
}

/**
 Base class for connection-based streams (TCP).
 The socket parameter is optional for incoming connections.
*/
function Connection (opts) {
  EventEmitter.call(this)

  this.streamAttrs = (opts && opts.streamAttrs) || {}
  this.xmlns = (opts && opts.xmlns) || {}
  this.xmlns.stream = NS_STREAM

  this.streamOpen = (opts && opts.streamOpen) || STREAM_OPEN
  this.streamClose = (opts && opts.streamClose) || STREAM_CLOSE

  this.rejectUnauthorized = !!(opts && opts.rejectUnauthorized)
  this.serialized = !!(opts && opts.serialized)
  this.requestCert = !!(opts && opts.requestCert)

  this.servername = (opts && opts.servername)

  this.boundOnData = this.onData.bind(this)
  this.boundOnClose = this.onClose.bind(this)
  this.boundEmitData = this.emit.bind(this, 'data')
  this.boundEmitDrain = this.emit.bind(this, 'drain')

  this._setupSocket(defaultInjection(this, opts))
  this.once('reconnect', function () {
    this.reconnect = opts && opts.reconnect
  })
}

inherits(Connection, EventEmitter)

Connection.prototype.NS_XMPP_TLS = NS_XMPP_TLS
Connection.NS_STREAM = NS_STREAM
Connection.prototype.NS_XMPP_STREAMS = NS_XMPP_STREAMS
// Defaults
Connection.prototype.allowTLS = true

Connection.prototype._setupSocket = function (options) {
  debug('setup socket')
  var previousOptions = {}
  var inject = reconnect(function (opts) {
    var previousSocket = this.socket
    /* if this opts.preserve is on
     * the previous options are stored until next time.
     * this is needed to restore from a setSecure call.
     */
    if (opts.preserve === 'on') {
      opts.preserve = previousOptions
      previousOptions = opts
    } else if (opts.preserve) {
      // switch back to the preversed options
      opts = previousOptions = opts.preserve
    } else {
      // keep some state for eg SRV.connect
      opts = previousOptions = opts || previousOptions
    }

    if (typeof opts.socket === 'function') {
      debug('use lazy socket')
      /* lazy evaluation
       * (can be retriggered by calling connection.connect()
       *  without arguments after a previous
       *  connection.connect({socket:function() { … }})) */
      this.socket = opts.socket.call(this)
    } else {
      debug('use standard socket')
      // only use this socket once
      this.socket = opts.socket
      opts.socket = null
      if (this.socket) {
        this.once('connect', function () {
          inject.options.immediate = false
        })
      }
    }
    this.socket = this.socket || new net.Socket()
    if (previousSocket !== this.socket) {
      this.setupStream()
    }
    return this.socket
  }.bind(this))

  inject(inject.options = options)

  // wrap the end function provided by reconnect-core to trigger the stream end logic
  var end = this.end
  this.end = this.disconnect = function () {
    this.closeStream()
    end()
  }

  this.on('connection', function () {
    if (!this.parser) this.startParser()
  })
  this.on('end', function () {
    previousOptions = {}
  })
}

/**
 Used by both the constructor and by reinitialization in setSecure().
*/
Connection.prototype.setupStream = function () {
  debug('setup stream')
  this.socket.on('end', this.onEnd.bind(this))
  this.socket.on('data', this.boundOnData)
  this.socket.on('close', this.boundOnClose)
  // let them sniff unparsed XML
  this.socket.on('data', this.boundEmitData)
  this.socket.on('drain', this.boundEmitDrain)
  // ignore errors after disconnect
  this.socket.on('error', function () {})

  if (!this.socket.serializeStanza) {
    /**
    * This is optimized for continuous TCP streams. If your "socket"
    * actually transports frames (WebSockets) and you can't have
    * stanzas split across those, use:
    *     cb(el.toString())
    */
    if (this.serialized) {
      this.socket.serializeStanza = function (el, cb) {
        // Continuously write out
        el.write(function (s) {
          cb(s)
        })
      }
    } else {
      this.socket.serializeStanza = function (el, cb) {
        cb(el.toString())
      }
    }
  }
}

Connection.prototype.pause = function () {
  if (this.socket.pause) this.socket.pause()
}

Connection.prototype.resume = function () {
  if (this.socket.resume) this.socket.resume()
}

/** Climbs the stanza up if a child was passed,
    but you can send strings and buffers too.

    Returns whether the socket flushed data.
*/
Connection.prototype.send = function (stanza) {
  if (!this.socket || !this.streamOpened) return

  if (!this.socket.writable) {
    this.socket.end()
    return
  }

  debug('send: ' + stanza.toString())

  var flushed = true

  if (stanza.root) {
    var el = this.rmXmlns(stanza.root())
    this.socket.serializeStanza(el, function (s) {
      flushed = this.write(s)
    }.bind(this.socket))
  } else {
    flushed = this.socket.write(stanza)
  }
  return flushed
}

Connection.prototype.startParser = function () {
  var self = this
  this.parser = new StreamParser(this.maxStanzaSize)

  this.parser.on('streamStart', function (attrs) {
    /* We need those xmlns often, store them extra */
    self.streamNsAttrs = {}
    for (var k in attrs) {
      if (k === 'xmlns' || (k.substr(0, 6) === 'xmlns:')) {
        self.streamNsAttrs[k] = attrs[k]
      }
    }

    /* Notify in case we don't wait for <stream:features/>
       (Component or non-1.0 streams)
     */
    self.emit('streamStart', attrs)
  })
  this.parser.on('stanza', function (stanza) {
    self.onStanza(self.addStreamNs(stanza))
  })
  this.parser.on('error', function (e) {
    self.error(e.condition || 'internal-server-error', e.message)
  })
  this.parser.once('end', function () {
    self.stopParser()
    if (self.reconnect) {
      self.once('reconnect', self.startParser.bind(self))
    } else {
      self.end()
    }
  })
}

Connection.prototype.stopParser = function () {
  /* No more events, please (may happen however) */
  if (this.parser) {
    var parser = this.parser
    /* Get GC'ed */
    this.parser = null
    parser.end()
  }
}

/**
 * http://xmpp.org/rfcs/rfc6120.html#streams-open
 */
Connection.prototype.openStream = function () {
  var attrs = {}
  for (var k in this.xmlns) {
    if (this.xmlns.hasOwnProperty(k)) {
      if (!k) {
        attrs.xmlns = this.xmlns[k]
      } else {
        attrs['xmlns:' + k] = this.xmlns[k]
      }
    }
  }
  for (k in this.streamAttrs) {
    if (this.streamAttrs.hasOwnProperty(k)) {
      attrs[k] = this.streamAttrs[k]
    }
  }

  if (this.streamTo) { // in case of a component connecting
    attrs.to = this.streamTo
  }

  var el = new Element(this.streamOpen, attrs)
  var streamOpen
  if (el.name === 'stream:stream') {
    // make it non-empty to cut the closing tag
    el.t(' ')
    var s = el.toString()
    streamOpen = s.substr(0, s.indexOf(' </stream:stream>'))
  } else {
    streamOpen = el.toString()
  }

  this.streamOpened = true
  this.send(streamOpen)
}
// FIXME deprecate
Connection.prototype.startStream = Connection.prototype.openStream

/**
 * http://xmpp.org/rfcs/rfc6120.html#streams-close
 */
Connection.prototype.closeStream = function () {
  this.send(this.streamClose)
  this.streamOpened = false
}
// FIXME deprecate
Connection.prototype.endStream = Connection.prototype.closeStream

Connection.prototype.onData = function (data) {
  debug('receive: ' + data.toString('utf8'))
  if (this.parser) {
    this.parser.write(data)
  }
}

Connection.prototype.setSecure = function (credentials, isServer, servername) {
  // Remove old event listeners
  this.socket.removeListener('data', this.boundOnData)
  this.socket.removeListener('data', this.boundEmitData)

  // retain socket 'end' listeners because ssl layer doesn't support it
  this.socket.removeListener('drain', this.boundEmitDrain)
  this.socket.removeListener('close', this.boundOnClose)
  // remove idle_timeout
  if (this.socket.clearTimer) {
    this.socket.clearTimer()
  }

  var cleartext = starttls({
    socket: this.socket,
    rejectUnauthorized: this.rejectUnauthorized,
    credentials: credentials || this.credentials,
    requestCert: this.requestCert,
    isServer: !!isServer,
    servername: isServer && servername
  }, function () {
    this.isSecure = true
    this.once('disconnect', function () {
      this.isSecure = false
    })
    cleartext.emit('connect', cleartext)
  }.bind(this))
  cleartext.on('clientError', this.emit.bind(this, 'error'))
  if (!this.reconnect) {
    this.reconnect = true // need this so stopParser works properly
    this.once('reconnect', function () { this.reconnect = false })
  }
  this.stopParser()
  // if we reconnect we need to get back to the previous socket creation
  this.listen({ socket: cleartext, preserve: 'on' })
}

function getAllText (el) {
  return !el.children ? el : el.children.reduce(function (text, child) {
    return text + getAllText(child)
  }, '')
}

/**
 * This is not an event listener, but takes care of the TLS handshake
 * before 'stanza' events are emitted to the derived classes.
 */
Connection.prototype.onStanza = function (stanza) {
  if (stanza.is('error', NS_STREAM)) {
    var error = new Error('' + getAllText(stanza))
    error.stanza = stanza
    this.socket.emit('error', error)
  } else if (stanza.is('features', this.NS_STREAM) &&
    this.allowTLS &&
    !this.isSecure &&
    stanza.getChild('starttls', this.NS_XMPP_TLS)) {
    /* Signal willingness to perform TLS handshake */
    this.send(new Element('starttls', { xmlns: this.NS_XMPP_TLS }))
  } else if (this.allowTLS &&
    stanza.is('proceed', this.NS_XMPP_TLS)) {
    /* Server is waiting for TLS handshake */
    this.setSecure()
  } else {
    this.emit('stanza', stanza)
  }
}

/**
 * Add stream xmlns to a stanza
 *
 * Does not add our default xmlns as it is different for
 * C2S/S2S/Component connections.
 */
Connection.prototype.addStreamNs = function (stanza) {
  for (var attr in this.streamNsAttrs) {
    if (!stanza.attrs[attr] &&
      !((attr === 'xmlns') && (this.streamNsAttrs[attr] === this.xmlns['']))
    ) {
      stanza.attrs[attr] = this.streamNsAttrs[attr]
    }
  }
  return stanza
}

/**
 * Remove superfluous xmlns that were aleady declared in
 * our <stream:stream>
 */
Connection.prototype.rmXmlns = function (stanza) {
  for (var prefix in this.xmlns) {
    var attr = prefix ? 'xmlns:' + prefix : 'xmlns'
    if (stanza.attrs[attr] === this.xmlns[prefix]) {
      stanza.attrs[attr] = null
    }
  }
  return stanza
}

/**
 * XMPP-style end connection for user
 */
Connection.prototype.onEnd = function () {
  this.closeStream()
  if (!this.reconnect) {
    this.emit('end')
  }
}

Connection.prototype.onClose = function () {
  if (!this.reconnect) {
    this.emit('close')
  }
}

/**
 * End connection with stream error.
 * Emits 'error' event too.
 *
 * @param {String} condition XMPP error condition, see RFC3920 4.7.3. Defined Conditions
 * @param {String} text Optional error message
 */
Connection.prototype.error = function (condition, message) {
  this.emit('error', new Error(message))

  if (!this.socket || !this.socket.writable) return

  /* RFC 3920, 4.7.1 stream-level errors rules */
  if (!this.streamOpened) this.openStream()

  var error = new Element('stream:error')
  error.c(condition, { xmlns: NS_XMPP_STREAMS })
  if (message) {
    error.c('text', {
      xmlns: NS_XMPP_STREAMS,
      'xml:lang': 'en'
    }).t(message)
  }

  this.send(error)
  this.end()
}

module.exports = Connection
