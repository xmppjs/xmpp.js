'use strict'

const EventEmitter = require('@xmpp/events')
const StreamParser = require('@xmpp/streamparser')
const JID = require('@xmpp/jid')
const url = require('url')
const xml = require('@xmpp/xml')

class XMPPError extends Error {
  constructor (condition, text, element) {
    super(condition + (text ? ` - ${text}` : ''))
    this.name = 'XMPPError'
    this.condition = condition
    this.text = text
    this.element = element
  }
}

class StreamError extends XMPPError {
  constructor (...args) {
    super(...args)
    this.name = 'StreamError'
  }
}

// we ignore url module from the browser bundle to reduce its size
function getHostname (uri) {
  if (url.parse) {
    const parsed = url.parse(uri)
    return parsed.hostname || parsed.pathname
  } else {
    const el = document.createElement('a')
    el.href = uri
    return el.hostname
  }
}

class Connection extends EventEmitter {
  constructor (options) {
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
  }

  _attachSocket (socket) {
    const sock = this.socket = socket
    const listeners = this.socketListeners
    listeners.data = (data) => {
      data = data.toString('utf8')
      this.emit('input', data)
      this.parser.write(data)
    }
    listeners.close = () => {
      this.domain = ''
      this.jid = null
      this.emit('close')
    }
    listeners.connect = () => {
      this.emit('connect')
    }
    listeners.error = (error) => {
      this.emit('error', error)
    }
    sock.on('data', listeners.data)
    sock.on('error', listeners.error)
    sock.on('close', listeners.close)
    sock.on('connect', listeners.connect)
  }

  _detachSocket (socket) {
    const listeners = this.socketListeners
    Object.getOwnPropertyNames(listeners).forEach(k => {
      this.socket.removeListener(k, listeners[k])
    })
  }

  _attachParser (parser) {
    const errorListener = (error) => {
      this.emit('error', error)
    }

    this.parser = parser
    const elementListener = (element) => {
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
    parser.on('element', elementListener)
    parser.on('error', errorListener)
  }

  _jid (jid) {
    this.jid = JID(jid)
    return this.jid
  }

  _online () {
    this.emit('online', this.jid)
  }

  _authenticated () {
    this.emit('authenticated')
  }

  id () {
    return Math.random().toString().split('0.')[1]
  }

  /**
   * opens the socket then opens the stream
   */
  start (options) {
    return new Promise((resolve, reject) => {
      if (typeof options === 'string') {
        options = {uri: options}
      }

      if (!options.domain) {
        options.domain = getHostname(options.uri)
      }

      this.promise('online').then(resolve, reject)
      this.connect(options.uri).then(() => {
        const {domain, lang} = options
        return this.open({domain, lang})
      }, reject)
    })
  }

  /**
   * closes the stream then closes the socket
   */
  stop () {
    return new Promise((resolve, reject) => {
      this.close().catch(reject) // FIXME wait footer
      this.end().then(resolve, reject)
    })
  }

  /**
   * opens the socket
   */
  connect (options) {
    this.connectOptions = options
    return new Promise((resolve, reject) => {
      this._attachParser(new this.Parser())
      this._attachSocket(new this.Socket())
      this.socket.once('error', reject)
      this.socket.connect(this.socketParameters(options), () => {
        this.socket.removeListener('error', reject)
        resolve()
      })
    })
  }

  /**
   * closes the socket
   */
  end () {
    return new Promise((resolve, reject) => {
       // TODO timeout
      const handler = () => {
        this.socket.end()
        this.once('close', resolve)
      }
      this.parser.once('end', handler)
    })
  }

  /**
   * opens the stream
   */
  open (options) {
    this.openOptions = options
    if (typeof options === 'string') options = {domain: options}
    return new Promise((resolve, reject) => {
      const {domain, lang} = options

      const headerElement = this.headerElement()
      headerElement.attrs.to = domain
      headerElement.attrs['xml:lang'] = lang

      this.write(this.header(headerElement))

      this.parser.once('start', el => {
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
        this.emit('open', el)
      })
    })
  }

  /**
   * closes the stream
   */
  close () {
    return this.promiseWrite(this.footer(this.footerElement()))
  }

  /**
   * restarts the stream
   */
  restart () {
    return this.open(this.openOptions)
  }

  send (element) {
    const root = element.root()
    return this.promiseWrite(root).then(() => {
      this.emit('send', root)
    })
  }

  sendReceive (element, timeout = this.timeout) {
    return new Promise((resolve, reject) => {
      this.send(element).catch(reject)
      this.promise('element', timeout).then(resolve, reject)
    })
  }

  promiseWrite (data) {
    return new Promise((resolve, reject) => {
      this.write(data, (err) => {
        if (err) return reject(err)
        else resolve()
      })
    })
  }

  write (data, fn) {
    fn = fn || function () {}
    data = data.toString('utf8').trim()
    this.socket.write(data, (err) => {
      if (err) return fn(err)
      this.emit('output', data)
      fn()
    })
  }

  writeReceive (data, timeout = this.timeout) {
    return new Promise((resolve, reject) => {
      this.promiseWrite(data).catch(reject)
      this.promise('element', timeout).then(resolve, reject)
    })
  }

  isStanza (element) {
    const {name} = element
    const NS = element.findNS()
    return (
      // this.online && FIXME
      (NS ? NS === this.NS : true) &&
      (name === 'iq' || name === 'message' || name === 'presence')
    )
  }

  isNonza (element) {
    return !this.isStanza(element)
  }

  plugin (plugin) {
    if (!this.plugins[plugin.name]) {
      this.plugins[plugin.name] = plugin.plugin(this)
      const p = this.plugins[plugin.name]
      if (p && p.start) p.start()
      else if (p && p.register) p.register()
    }

    return this.plugins[plugin.name]
  }

  // override
  header (el) {
    return el.toString()
  }
  headerElement () {
    return new xml.Element('', {
      version: '1.0',
      xmlns: this.NS,
    })
  }
  footer (el) {
    return el.toString()
  }
  footerElement () {}
  socketParameters (uri) {
    const parsed = url.parse(uri)
    parsed.port = +parsed.port
    parsed.host = parsed.hostname
    return parsed
  }
}

// overrirde
Connection.prototype.NS = ''
Connection.prototype.Socket = null
Connection.prototype.Parser = StreamParser

module.exports = Connection
module.exports.getHostname = getHostname
module.exports.XMPPError = XMPPError
module.exports.StreamError = StreamError
