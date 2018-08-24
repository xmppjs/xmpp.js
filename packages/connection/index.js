'use strict'

const {timeout, EventEmitter, promise} = require('@xmpp/events')
const jid = require('@xmpp/jid')
const xml = require('@xmpp/xml')
const URL = global.URL || require('url').URL // eslint-disable-line node/no-unsupported-features/node-builtins

const NS_STREAM = 'urn:ietf:params:xml:ns:xmpp-streams'

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

function socketConnect(socket, ...params) {
  return new Promise((resolve, reject) => {
    function onError(err) {
      socket.removeListener('connect', onConnect)
      reject(err)
    }

    function onConnect(value) {
      socket.removeListener('error', onError)
      resolve(value)
    }

    socket.once('error', onError)
    socket.once('connect', onConnect)

    socket.connect(...params)
  })
}

function getDomain(uri) {
  // WHATWG URL parser requires a protocol
  if (!uri.includes('://')) {
    uri = 'http://' + uri
  }
  const url = new URL(uri)
  // WHATWG URL parser doesn't support non Web protocols in browser
  url.protocol = 'http:'
  return url.hostname
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
    this.socket = null
    this.parser = null
  }

  _reset() {
    this.domain = ''
    this.lang = ''
    this.jid = null
    this.status = 'offline'
    this._detachSocket()
    this._detachParser()
  }

  async _streamError(condition) {
    try {
      await this.send(
        // prettier-ignore
        xml('stream:error', {}, [
          xml(condition, {xmlns: NS_STREAM}),
        ])
      )
    } catch (err) {}

    return this._end()
  }

  async _onData(data) {
    const str = data.toString('utf8')
    this.emit('input', str)
    try {
      await this.parser.write(str)
    } catch (err) {
      // https://xmpp.org/rfcs/rfc6120.html#streams-error-conditions-bad-format
      // "This error can be used instead of the more specific XML-related errors,
      // such as <bad-namespace-prefix/>, <invalid-xml/>, <not-well-formed/>, <restricted-xml/>,
      // and <unsupported-encoding/>. However, the more specific errors are RECOMMENDED."
      try {
        this._streamError('bad-format')
      } catch (err) {}
    }
  }

  _attachSocket(socket) {
    const sock = (this.socket = socket)
    const listeners = this.socketListeners
    listeners.data = data => {
      this._onData(data)
    }
    listeners.close = (dirty, event) => {
      this._reset()
      this._status('disconnect', {clean: !dirty, event})
    }
    listeners.connect = () => {
      this._status('connect')
    }
    listeners.error = error => {
      this.emit('error', error)
    }
    sock.on('close', listeners.close)
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
    this.socket = null
  }

  _onElement(element) {
    this.emit('element', element)
    this.emit(this.isStanza(element) ? 'stanza' : 'nonza', element)
    // https://xmpp.org/rfcs/rfc6120.html#streams-error
    if (element.name !== 'stream:error') return
    this.emit(
      'error',
      new StreamError(
        element.children[0].name,
        element.getChildText('text', NS_STREAM) || '',
        element
      )
    )
    // "Stream Errors Are Unrecoverable"
    // "The entity that receives the stream error then SHALL close the stream"
    this._end()
  }

  _attachParser(p) {
    const parser = (this.parser = p)
    const listeners = this.parserListeners
    listeners.element = element => {
      this._onElement(element)
    }
    listeners.error = error => {
      this._detachParser()
      this.emit('error', error)
    }
    listeners.end = element => {
      this._detachParser()
      this._status('close', element)
    }
    parser.on('error', listeners.error)
    parser.on('element', listeners.element)
    parser.on('end', listeners.end)
  }

  _detachParser() {
    const listeners = this.parserListeners
    Object.getOwnPropertyNames(listeners).forEach(k => {
      this.parser.removeListener(k, listeners[k])
      delete listeners[k]
    })
    this.parser = null
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

  async _end() {
    let el
    try {
      el = await this.close()
    } catch (err) {}
    try {
      await this.disconnect()
    } catch (err) {}
    return el
  }

  /**
   * Opens the socket then opens the stream
   */
  async start(options) {
    if (this.status !== 'offline') {
      throw new Error('Connection is not offline')
    }

    this.startOptions = options

    if (typeof options === 'string') {
      options = {uri: options}
    }

    if (!options.domain) {
      options.domain = getDomain(options.uri)
    }

    await this.connect(options.uri)

    const promiseOnline = promise(this, 'online')

    const {domain, lang} = options
    await this.open({domain, lang})

    return promiseOnline
  }

  /**
   * Connects the socket
   */
  // eslint-disable-next-line require-await
  async connect(options) {
    this._status('connecting')
    this.connectOptions = options
    this._attachSocket(new this.Socket())
    // The 'connect' status is set by the socket 'connect' listener
    return socketConnect(this.socket, this.socketParameters(options))
  }

  /**
   * Disconnects the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  async disconnect(ms = this.timeout) {
    if (this.socket) this._status('disconnecting')

    this.socket.end()

    // The 'disconnect' status is set by the socket 'close' listener
    await timeout(promise(this.socket, 'close'), ms)
  }

  /**
   * Opens the stream
   */
  async open(options) {
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

    this._attachParser(new this.Parser())

    await this.write(this.header(headerElement))

    const promiseStart = async () => {
      const el = await promise(this.parser, 'start')
      // FIXME what about version and xmlns:stream ?
      if (
        el.name !== headerElement.name ||
        el.attrs.xmlns !== headerElement.attrs.xmlns ||
        el.attrs.from !== headerElement.attrs.to ||
        !el.attrs.id
      ) {
        return promise(this, 'error')
      }

      this.domain = domain
      this.lang = el.attrs['xml:lang']
      this._status('open', el)

      return el
    }

    return timeout(promiseStart(), options.timeout || this.timeout)
  }

  /**
   * Closes the stream then closes the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  async stop() {
    const el = await this._end()
    if (this.status !== 'offline') this._status('offline', el)
    return el
  }

  /**
   * Closes the stream and wait for the server to close it
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  async close(ms = this.timeout) {
    const p = Promise.all([
      timeout(promise(this.parser, 'end'), ms),
      this.write(this.footer(this.footerElement())),
    ])

    if (this.parser && this.socket) this._status('closing')
    const [el] = await p
    return el
    // The 'close' status is set by the parser 'end' listener
  }

  /**
   * Restart the stream
   * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation-restart
   */
  // eslint-disable-next-line require-await
  async restart() {
    this._detachParser()
    this._attachParser(new this.Parser())
    return this.open(this.openOptions)
  }

  // eslint-disable-next-line require-await
  async send(element) {
    this.emit('outgoing', element)

    const proceed = () => {
      return this.write(element).then(() => {
        this.emit('send', element)
      })
    }

    return this.hookOutgoing
      ? this.hookOutgoing(element).then(proceed)
      : proceed()
  }

  sendReceive(element, ms = this.timeout) {
    return Promise.all([
      this.send(element),
      timeout(promise(this, 'element'), ms),
    ]).then(([, el]) => el)
  }

  write(data) {
    return new Promise((resolve, reject) => {
      // https://xmpp.org/rfcs/rfc6120.html#streams-close
      // "Refrain from sending any further data over its outbound stream to the other entity"
      if (this.status === 'closing') {
        reject(new Error('Connection is closing'))
        return
      }
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

  // Override
  headerElement() {
    return new xml.Element('', {
      version: '1.0',
      xmlns: this.NS,
    })
  }

  // Override
  footer(el) {
    return el.toString()
  }

  // Override
  footerElement() {}

  // Override
  socketParameters() {}
}

// Overrirde
Connection.prototype.NS = ''
Connection.prototype.Socket = null
Connection.prototype.Parser = null

module.exports = Connection
module.exports.getDomain = getDomain
module.exports.XMPPError = XMPPError
module.exports.StreamError = StreamError
module.exports.socketConnect = socketConnect
