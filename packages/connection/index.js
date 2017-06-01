'use strict'

const {timeout, EventEmitter, promify} = require('@xmpp/events')
const jid = require('@xmpp/jid')
const url = require('url')
const xml = require('@xmpp/xml')

class XMPPError extends Error {
  constructor(condition, text, element) {
    super(condition + (text ? ` - ${text}` : ''))
    this.name = 'XMPPError'
    this.condition = condition
    this.text = text
    this.element = element
  }
}

class StreamError extends XMPPError {
  constructor(...args) {
    super(...args)
    this.name = 'StreamError'
  }
}

// We ignore url module from the browser bundle to reduce its size
function getHostname(uri) {
  if (url.parse) {
    const parsed = url.parse(uri)
    return parsed.hostname || parsed.pathname
  }
  const el = document.createElement('a') // eslint-disable-line no-undef
  el.href = uri
  return el.hostname
}

class Connection extends EventEmitter {
  constructor(options) {
    super()
    this.domain = null
    this.lang = null
    this.jid = null
    this.timeout = 2000
    this.options = typeof options === 'object' ? options : {}
    this.plugins = Object.create(null)
    this.openOptions = null
    this.connectOptions = null
    this.socketListeners = Object.create(null)
    this.status = 'offline'
  }

  _attachSocket(socket) {
    const sock = this.socket = socket
    const listeners = this.socketListeners
    listeners.data = data => {
      const str = data.toString('utf8')
      this.emit('input', str)
      this.parser.write(str)
    }
    listeners.close = () => {
      this.domain = ''
      this.jid = null
      this.emit('close')
    }
    listeners.connect = () => {
      this.emit('connect')
    }
    listeners.error = error => {
      this.emit('error', error)
    }
    sock.on('data', listeners.data)
    sock.on('error', listeners.error)
    sock.on('close', listeners.close)
    sock.on('connect', listeners.connect)
  }

  _detachSocket() {
    const listeners = this.socketListeners
    Object.getOwnPropertyNames(listeners).forEach(k => {
      this.socket.removeListener(k, listeners[k])
    })
  }

  _attachParser(parser) {
    const errorListener = error => {
      this.emit('error', error)
    }

    this.parser = parser
    const elementListener = element => {
      if (element.name === 'stream:error') {
        this.stop()
        this.emit('error', new StreamError(
          element.children[0].name,
          element.getChildText('text', 'urn:ietf:params:xml:ns:xmpp-streams') || '',
          element
        ))
      }
      this.emit('element', element)
      this.emit(this.isStanza(element) ? 'stanza' : 'nonza', element)
    }
    parser.on('endElement', elementListener)
    parser.once('error', errorListener)
  }

  _jid(addr) {
    this.jid = jid(addr)
    return this.jid
  }

  _status(status, ...args) {
    this.status = status
    this.emit('status', status, ...args)
    this.emit(status, ...args)
  }

  id() {
    return Math.random().toString().split('0.')[1]
  }

  /**
   * Opens the socket then opens the stream
   */
  start(options) {
    this._status('starting')
    if (typeof options === 'string') {
      options = {uri: options}
    }

    if (!options.domain) {
      options.domain = getHostname(options.uri)
    }

    return Promise.all([
      this.promise('online'),
      this.connect(options.uri).then(() => {
        const {domain, lang} = options
        return this.open({domain, lang})
      }),
    ]).then(([, res]) => res)
  }

  /**
   * Closes the stream then closes the socket
   */
  stop() {
    this._status('stopping')
    return new Promise((resolve, reject) => {
      this.close().catch(reject) // FIXME wait footer
      this.disconnect().then(resolve, reject)
    })
  }

  /**
   * Connects the socket
   */
  connect(options) {
    this._status('connecting')
    this.connectOptions = options
    return new Promise((resolve, reject) => {
      this._attachParser(new this.Parser())
      this._attachSocket(new this.Socket())
      this.socket.once('error', reject)
      this.socket.connect(this.socketParameters(options), () => {
        this.socket.removeListener('error', reject)
        resolve()
        this._status('connect')
      })
    })
  }

  /**
   * Disconnects the socket
   */
  disconnect() {
    this._status('disconnecting')
    return new Promise(resolve => {
       // TODO timeout
      const handler = () => {
        this.socket.end()
        this.once('close', () => {
          resolve()
          this._statis('disconnected')
        })
      }
      this.parser.once('end', handler)
    })
  }

  /**
   * Opens the stream
   */
  open(options) {
    this._status('opening')
    this.openOptions = options
    if (typeof options === 'string') {
      options = {domain: options}
    }
    return new Promise((resolve, reject) => {
      const {domain, lang} = options

      const headerElement = this.headerElement()
      headerElement.attrs.to = domain
      headerElement.attrs['xml:lang'] = lang

      this.write(this.header(headerElement))

      this.parser.once('startElement', el => {
        // FIXME what about version and xmlns:stream ?
        if (
          el.name !== headerElement.name ||
          el.attrs.xmlns !== headerElement.attrs.xmlns ||
          el.attrs.from !== headerElement.attrs.to ||
          !el.attrs.id
        ) {
          return this.once('error', reject)
        }

        this.domain = domain
        this.lang = el.attrs['xml:lang']
        resolve(el)
        this._status('open', el)
      })
    })
  }

  /**
   * Closes the stream
   */
  close() {
    this._status('closing')
    return this.write(this.footer(this.footerElement())).then(() => {
      this._status('close')
    })
  }

  ready(fn) {
    if (this.status === 'online') {
      fn(this.jid)
    }
    return this.listen('online', fn)
  }

  /**
   * Restart the stream
   * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation-restart
   */
  restart() {
    this._status('restarting')
    return this.open(this.openOptions).then(() => {
      this._status('restart')
    })
  }

  send(element) {
    return this.write(element).then(() => {
      this.emit('send', element)
    })
  }

  sendReceive(element, ms = this.timeout) {
    return Promise.all([
      this.send(element),
      timeout(this.promise('element'), ms),
    ]).then(([, el]) => el)
  }

  write(data) {
    const str = data.toString('utf8')
    return promify(this.socket, 'write', str).then(() => {
      this.emit('output', str)
    })
  }

  isStanza(element) {
    const {name} = element
    const NS = element.attrs.xmlns
    return (
      // This.online && FIXME
      (NS ? NS === this.NS : true) &&
      (name === 'iq' || name === 'message' || name === 'presence')
    )
  }

  isNonza(element) {
    return !this.isStanza(element)
  }

  plugin(plugin) {
    if (!this.plugins[plugin.name]) {
      this.plugins[plugin.name] = plugin.plugin(this)
      const p = this.plugins[plugin.name]
      if (p && p.start) {
        p.start()
      } else if (p && p.register) {
        p.register()
      }
    }

    return this.plugins[plugin.name]
  }

  // Override
  header(el) {
    return el.toString()
  }
  headerElement() {
    return new xml.Element('', {
      version: '1.0',
      xmlns: this.NS,
    })
  }
  footer(el) {
    return el.toString()
  }
  footerElement() {}
  socketParameters(uri) {
    const parsed = url.parse(uri)
    parsed.port = Number(parsed.port)
    parsed.host = parsed.hostname
    return parsed
  }
}

// Overrirde
Connection.prototype.NS = ''
Connection.prototype.Socket = null
Connection.prototype.Parser = xml.Parser

module.exports = Connection
module.exports.getHostname = getHostname
module.exports.XMPPError = XMPPError
module.exports.StreamError = StreamError
