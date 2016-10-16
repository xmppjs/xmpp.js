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

// we ignore url module from the browser bundle to reduce its size
function getHostname (uri) {
  if (url.parse) {
    return url.parse(uri).hostname
  } else {
    const el = document.createElement('a')
    el.href = uri
    return el.hostname
  }
}

class Connection extends EventEmitter {
  constructor (options) {
    super()
    this.online = false
    this._domain = null
    this.lang = null
    this.jid = null
    this.timeout = 2000
    this.options = typeof options === 'object' ? options : {}
    this.plugins = Object.create(null)
    this.startOptions = null

    if (this.Socket && this.Parser) {
      this._handle(new this.Socket(), new this.Parser())
    }
  }

  stop () {
    return this.end()
      .then(() => this.close())
  }

  _handle (socket, parser) {
    const errorListener = (error) => {
      this.emit('error', error)
    }

    // socket
    const sock = this.socket = socket
    const dataListener = (data) => {
      data = data.toString('utf8')
      this.parser.write(data)
      // FIXME only if parser.write ok
      this.emit('fragment', data)
    }
    const closeListener = () => {
      this._domain = ''
      this.online = false
      this.emit('close')
    }
    const connectListener = () => {
      this.online = true
      this.emit('connect')
    }
    sock.on('data', dataListener)
    sock.on('error', errorListener)
    sock.on('close', closeListener)
    sock.on('connect', connectListener)

    // parser
    this.parser = parser
    const elementListener = (element) => {
      if (element.name === 'stream:error') {
        const condition = element.children[0].name
        const textEl = element.getChild('text', 'urn:ietf:params:xml:ns:xmpp-streams')
        this.emit('error', error(condition, textEl.text()))
      }
      this.emit('element', element)
      this.emit(this.isStanza(element) ? 'stanza' : 'nonza', element)
    }
    parser.on('element', elementListener)
    parser.on('error', errorListener)
  }

  _jid (jid) {
    jid = JID(jid)
    this.jid = jid
    return jid
  }

  _ready () {
    this.emit('ready', this.jid)
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
    this.startOptions = options
    return new Promise((resolve, reject) => {
      if (typeof options === 'string') {
        options = {uri: options}
      }

      if (!options.domain) {
        options.domain = getHostname(options.uri)
      }

      this.connect(options.uri)
        .then(() => {
          this.open(options.domain, options.lang)
            .then(() => {
              // FIXME reject on error ?
              this.once('ready', resolve)
            }, reject)
        }, reject)
    })
  }

  /**
   * opens the socket
   */
  connect (options) {
    return new Promise((resolve, reject) => {
      this.socket.connect(options, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * opens the stream
   */
  open (domain, lang = 'en') {
    return new Promise((resolve, reject) => {
      // FIXME timeout
      this.waitHeader(domain, lang, (err, el) => {
        if (err) return reject(err)
        this._domain = domain
        this.lang = lang
        this.emit('open', el)
        resolve(el)
      })
      this.write(this.header(domain, lang))
    })
  }

  /**
   * restarts the stream
   */
  restart () {
    return this.open(this.socket._domain, this.socket.lang)
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
    return new Promise((resolve, reject) => {
      element = element.root()
      this.emit('send', element)
      this.write(element).then(resolve, reject)
    })
  }

  sendReceive (element, timeout = this.timeout) {
    return new Promise((resolve, reject) => {
      this.send(element).catch(reject)
      this._promise('element', timeout).then(resolve, reject)
    })
  }

  write (data) {
    return new Promise((resolve, reject) => {
      data = data.toString('utf8').trim()
      this.socket.write(data, (err) => {
        if (err) return reject(err)
        this.emit('fragment', undefined, data)
        resolve()
      })
    })
  }

  // FIXME maybe move to connection-tcp
  writeReceive (data, timeout = this.timeout) {
    return new Promise((resolve, reject) => {
      this.write(data).catch(reject)
      this._promise('element', timeout).then(resolve, reject)
    })
  }

  isStanza (element) {
    const {name} = element
    return (
      this.online &&
      (element.findNS() ? element.findNS() === this.NS : true) &&
      (name === 'iq' || name === 'message' || name === 'presence')
    )
  }

  isNonza (element) {
    return !this.isStanza(element)
  }

  end () {
    return this.write(this.footer())
  }

  close () {
    return new Promise((resolve, reject) => {
      // TODO timeout
      const handler = () => {
        this.socket.close()
        this.once('close', resolve)
      }
      this.parser.once('end', handler)
    })
  }

  plugin (plugin) {
    if (!this.plugins[plugin.name]) {
      this.plugins[plugin.name] = plugin.plugin(this)
    }
    if (this.plugins[plugin.name].register) this.plugins[plugin.name].register()
    return this.plugins[plugin.name]
  }

  // override
  waitHeader () {}
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
