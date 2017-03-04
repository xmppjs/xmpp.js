'use strict'

const EventEmitter = require('events')
const StreamParser = require('@xmpp/streamparser')
const JID = require('@xmpp/jid')
const url = require('url')

function error (name, message) {
  const e = new Error(message)
  e.name = name
  return e
}

class XMPPError extends Error {
  constructor(condition, text, element) {
    super()
    this.condition = condition
    this.text = text
    this.message = condition + (text ? ` - ${text}` : '')
    this.element = element
  }
}
XMPPError.prototype.name = 'XMPPError'

class StreamError extends XMPPError {}
StreamError.prototype.name = 'StreamError'

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
    this._domain = null
    this.lang = null
    this.jid = null
    this.timeout = 2000
    this.options = typeof options === 'object' ? options : {}
    this.plugins = Object.create(null)
    this.openOptions = null
    this.connectOptions = null
    this.socketListeners = Object.create(null)
  }

  stop () {
    return this.end()
      .then(() => this.close())
  }

  _attachSocket (socket) {
    const sock = this.socket = socket
    const listeners = this.socketListeners
    listeners.data = (data) => {
      data = data.toString('utf8')
      this.emit('fragment', data)
      this.parser.write(data)
    }
    listeners.close = () => {
      this._domain = ''
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
      this.emit('element', element)
      this.emit(this.isStanza(element) ? 'stanza' : 'nonza', element)
      if (element.name === 'stream:error') {
        this.stop()
        this.emit('error', new StreamError(
          element.children[0].name,
          element.getChildText('text', 'urn:ietf:params:xml:ns:xmpp-streams') || '',
          element
        ))
      }
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

      this.once('online', (jid) => {
        resolve(jid)
      })
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

      this.socket.connect(options, (err) => {
        if (err) reject(err)
        else resolve()
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
    return new Promise((resolve, reject) => {
      this.parser.once('start', el => {
        if (this.responseHeader(el, domain)) {
          this._domain = domain
          this.lang = el.attrs['xml:lang']
          resolve(el)
          this.emit('open', el)
        } else {
          reject(new Error('invalid response header received from server'))
        }
      })
      const {domain, lang} = options
      this.write(this.header(domain, lang))
    })
  }

  /**
   * closes the stream
   */
  close () {
    return this.promiseWrite(this.footer())
  }

  /**
   * restarts the stream
   */
  restart () {
    return this.open(this.openOptions)
  }

  _promise (event, timeout) {
    return new Promise((resolve, reject) => {
      let timer
      const cleanup = () => {
        this.removeListener(event, onEvent)
        this.removeListener('error', onError)
        clearTimeout(timer)
      }
      if (typeof timeout === 'number') {
        timer = setTimeout(() => {
          reject(error(
            'TimeoutError',
            `"${event}" event didn't fire within ${timeout}ms`
          ))
          cleanup()
        }, timeout)
      }
      const onError = (reason) => {
        reject(reason)
        cleanup()
      }
      const onEvent = (value) => {
        resolve(value)
        cleanup()
      }
      this.once('error', onError)
      this.once(event, onEvent)
    })
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
      this._promise('element', timeout).then(resolve, reject)
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
      this.emit('fragment', undefined, data)
      fn()
    })
  }

  writeReceive (data, timeout = this.timeout) {
    return new Promise((resolve, reject) => {
      this.promiseWrite(data).catch(reject)
      this._promise('element', timeout).then(resolve, reject)
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
    }
    if (this.plugins[plugin.name].register) this.plugins[plugin.name].register()
    return this.plugins[plugin.name]
  }

  // override
  responseHeader () {}
  header () {}
  footer () {}
  match () {}
}

// overrirde
Connection.prototype.NS = ''
Connection.prototype.Socket = null
Connection.prototype.Parser = StreamParser

module.exports = Connection
module.exports.getHostname = getHostname
module.exports.XMPPError = XMPPError
module.exports.StreamError = StreamError
