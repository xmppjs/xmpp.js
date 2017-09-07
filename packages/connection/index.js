'use strict'

const {timeout, EventEmitter, promise} = require('@xmpp/events')
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
    this.domain = ''
    this.lang = ''
    this.jid = null
    this.timeout = 2000
    this.options = typeof options === 'object' ? options : {}
    this.plugins = Object.create(null)
    this.startOptions = null
    this.openOptions = null
    this.connectOptions = null
    this.socketListeners = Object.create(null)
    this.parserListeners = Object.create(null)
    this.status = 'offline'
  }

  _reset() {
    this.domain = ''
    this.lang = ''
    this.jid = null
    this._detachSocket()
    this._detachParser()
    this.socket = null
  }

  _attachSocket(socket) {
    const sock = (this.socket = socket)
    const listeners = this.socketListeners
    listeners.data = data => {
      const str = data.toString('utf8')
      this.emit('input', str)
      this.parser.write(str)
    }
    listeners.close = (...args) => {
      this._reset()
      this._status('disconnect', ...args)
    }
    listeners.connect = () => {
      this._status('connect')
      sock.once('close', listeners.close)
    }
    listeners.error = error => {
      this._reset()
      if (this.status === 'connecting') {
        this._status('offline')
      }
      this.emit('error', error)
    }
    sock.on('data', listeners.data)
    sock.on('error', listeners.error)
    sock.on('connect', listeners.connect)
  }

  _detachSocket() {
    const listeners = this.socketListeners
    Object.getOwnPropertyNames(listeners).forEach(k => {
      this.socket.removeListener(k, listeners[k])
      delete listeners[k]
    })
    delete this.socket
  }

  _attachParser(p) {
    const parser = (this.parser = p)
    const listeners = this.parserListeners
    listeners.element = element => {
      if (element.name === 'stream:error') {
        this.close().then(() => this.disconnect())
        this.emit(
          'error',
          new StreamError(
            element.children[0].name,
            element.getChildText(
              'text',
              'urn:ietf:params:xml:ns:xmpp-streams'
            ) || '',
            element
          )
        )
      }
      this.emit('element', element)
      this.emit(this.isStanza(element) ? 'stanza' : 'nonza', element)
    }
    listeners.error = error => {
      this.emit('error', error)
    }
    listeners.end = element => {
      this._status('close', element)
    }
    parser.once('error', listeners.error)
    parser.on('element', listeners.element)
    parser.on('end', listeners.end)
  }

  _detachParser() {
    const listeners = this.parserListeners
    Object.getOwnPropertyNames(listeners).forEach(k => {
      this.parser.removeListener(k, listeners[k])
      delete listeners[k]
    })
    delete this.parser
  }

  _jid(id) {
    this.jid = jid(id)
    return this.jid
  }

  _status(status, ...args) {
    this.status = status
    this.emit('status', status, ...args)
    this.emit(status, ...args)
  }

  /**
   * Opens the socket then opens the stream
   */
  start(options) {
    if (this.status !== 'offline') {
      return Promise.reject(new Error('Connection is not offline'))
    }

    this.startOptions = options

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
    ]).then(([addr]) => addr)
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
        // The 'connect' status is emitted by the socket 'connect' listener
      })
    })
  }

  /**
   * Disconnects the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  disconnect(ms = this.timeout) {
    this._status('disconnecting')
    this.socket.end()
    return timeout(promise(this.socket, 'close'), ms)
    // The 'disconnect' status is emitted by the socket 'close' listener
  }

  /**
   * Opens the stream
   */
  open(options) {
    this._status('opening')
    // Useful for stream-features restart
    this.openOptions = options
    if (typeof options === 'string') {
      options = {domain: options}
    }

    const {domain, lang} = options

    const headerElement = this.headerElement()
    headerElement.attrs.to = domain
    headerElement.attrs['xml:lang'] = lang

    return Promise.all([
      this.write(this.header(headerElement)),
      promise(this.parser, 'start').then(el => {
        // FIXME what about version and xmlns:stream ?
        if (
          el.name !== headerElement.name ||
          el.attrs.xmlns !== headerElement.attrs.xmlns ||
          el.attrs.from !== headerElement.attrs.to ||
          !el.attrs.id
        ) {
          return this.promise('error')
        }

        this.domain = domain
        this.lang = el.attrs['xml:lang']
        this._status('open', el)
        return el
      }),
    ]).then(([, el]) => el)
  }

  /**
   * Closes the stream then closes the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  stop() {
    if (!this.socket) {
      return Promise.resolve()
    }
    return this.close().then(el =>
      this.disconnect().then(() => {
        this._status('offline')
        return el
      })
    )
  }

  /**
   * Closes the stream and wait for the server to close it
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  close(ms = this.timeout) {
    this._status('closing')

    return Promise.all([
      timeout(promise(this.parser, 'end'), ms),
      this.write(this.footer(this.footerElement())),
    ]).then(([el]) => el)
    // The 'close' status is emitted by the parser 'end' listener
  }

  /**
   * Restart the stream
   * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation-restart
   */
  restart() {
    this._detachParser()
    this._attachParser(new this.Parser())
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
    return new Promise((resolve, reject) => {
      const str = data.toString('utf8')
      this.socket.write(str, err => {
        if (err) {
          return reject(err)
        }
        this.emit('output', str)
        resolve()
      })
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
Connection.prototype.Parser = null

module.exports = Connection
module.exports.getHostname = getHostname
module.exports.XMPPError = XMPPError
module.exports.StreamError = StreamError
