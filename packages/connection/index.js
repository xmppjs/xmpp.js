'use strict'

const {EventEmitter, promise} = require('@xmpp/events')
const jid = require('@xmpp/jid')
const xml = require('@xmpp/xml')
const StreamError = require('./lib/StreamError')
const {parseHost, parseService} = require('./lib/util')

const NS_STREAM = 'urn:ietf:params:xml:ns:xmpp-streams'

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

class Connection extends EventEmitter {
  constructor(options = {}) {
    super()
    this.jid = null
    this.timeout = 2000
    this.options = options
    this.socketListeners = Object.create(null)
    this.parserListeners = Object.create(null)
    this.status = 'offline'
    this.socket = null
    this.parser = null
  }

  _reset() {
    this.jid = null
    this.status = 'offline'
    this._detachSocket()
    this._detachParser()
  }

  async _streamError(condition, children) {
    try {
      await this.send(
        // prettier-ignore
        xml('stream:error', {}, [
          xml(condition, {xmlns: NS_STREAM}, children),
        ])
      )
      // eslint-disable-next-line no-unused-vars
    } catch (err) {}

    return this._end()
  }

  async _onData(data) {
    const str = data.toString('utf8')
    this.emit('input', str)
    try {
      await this.parser.write(str)
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      // https://xmpp.org/rfcs/rfc6120.html#streams-error-conditions-bad-format
      // "This error can be used instead of the more specific XML-related errors,
      // such as <bad-namespace-prefix/>, <invalid-xml/>, <not-well-formed/>, <restricted-xml/>,
      // and <unsupported-encoding/>. However, the more specific errors are RECOMMENDED."
      try {
        this._streamError('bad-format')
        // eslint-disable-next-line no-unused-vars
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
    const {socketListeners, socket} = this
    Object.getOwnPropertyNames(socketListeners).forEach(k => {
      socket.removeListener(k, socketListeners[k])
      delete socketListeners[k]
    })
    this.socket = null
    return socket
  }

  _onElement(element) {
    this.emit('element', element)
    this.emit(this.isStanza(element) ? 'stanza' : 'nonza', element)

    if (element.name === 'stream:error') {
      this._onStreamError(element)
    }
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-error
  _onStreamError(element) {
    const error = StreamError.fromElement(element)

    if (error.condition === 'see-other-host') {
      this._onSeeOtherHost(error)
    } else {
      this.emit('error', error)
    }

    // "Stream Errors Are Unrecoverable"
    // "The entity that receives the stream error then SHALL close the stream"
    this._end()
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-error-conditions-see-other-host
  async _onSeeOtherHost(error) {
    const {protocol} = parseService(this.options.service)

    const host = error.element.getChildText('see-other-host')
    const {port} = parseHost(host)

    let service
    if (port) {
      service = `${protocol || 'xmpp:'}//${host}`
    } else {
      service = (protocol ? `${protocol}//` : '') + host
    }

    try {
      await promise(this, 'disconnect')
      const {domain, lang} = this.options
      await this.connect(service)
      await this.open({domain, lang})
    } catch (err) {
      this.emit('error', err)
    }
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
      // eslint-disable-next-line no-unused-vars
    } catch (err) {}

    try {
      await this.disconnect()
      // eslint-disable-next-line no-unused-vars
    } catch (err) {}

    return el
  }

  /**
   * Opens the socket then opens the stream
   */
  async start() {
    if (this.status !== 'offline') {
      throw new Error('Connection is not offline')
    }

    const {service, domain, lang} = this.options

    await this.connect(service)

    const promiseOnline = promise(this, 'online')

    await this.open({domain, lang})

    return promiseOnline
  }

  /**
   * Connects the socket
   */
  async connect(service) {
    this._status('connecting')
    this._attachSocket(new this.Socket())
    // The 'connect' status is set by the socket 'connect' listener
    return socketConnect(this.socket, this.socketParameters(service))
  }

  /**
   * Disconnects the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  async disconnect(timeout = this.timeout) {
    if (this.socket) this._status('disconnecting')

    this.socket.end()

    // The 'disconnect' status is set by the socket 'close' listener
    await promise(this.socket, 'close', 'error', timeout)
  }

  /**
   * Opens the stream
   */
  async open(options) {
    this._status('opening')

    if (typeof options === 'string') {
      options = {domain: options}
    }

    const {domain, lang, timeout = this.timeout} = options

    const headerElement = this.headerElement()
    headerElement.attrs.to = domain
    headerElement.attrs['xml:lang'] = lang

    this._attachParser(new this.Parser())

    await this.write(this.header(headerElement))

    const el = await promise(this.parser, 'start', 'error', timeout)
    this._status('open', el)
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
  async close(timeout = this.timeout) {
    const p = Promise.all([
      promise(this.parser, 'end', 'error', timeout),
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
  async restart() {
    this._detachParser()
    const {domain, lang} = this.options
    return this.open({domain, lang})
  }

  async send(element) {
    this.emit('outgoing', element)
    await this.write(element)
    this.emit('send', element)
  }

  sendReceive(element, timeout = this.timeout) {
    return Promise.all([
      this.send(element),
      promise(this, 'element', 'error', timeout),
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
    return name === 'iq' || name === 'message' || name === 'presence'
  }

  isNonza(element) {
    return !this.isStanza(element)
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
module.exports.socketConnect = socketConnect
