'use strict'

const { EventEmitter } = require('@xmpp/events')
const ltx = require('ltx')
const Socket = require('./Socket')
const debug = require('debug')('xmpp:bosh:http')
const http = require('http')
const serverStop = require('../../serverStop')

const NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'
const NEXT_REQUEST_TIMEOUT = 60 * 1000

function parseBody(stream, cb) {
  const parser = new ltx.Parser()
  stream.on('data', (data) => {
    parser.write(data)
  })
  stream.on('end', () => {
    parser.end()
  })
  stream.on('error', (e) => {
    cb(e)
  })
  parser.on('tree', (bodyEl) => {
    cb(null, bodyEl)
  })
  parser.on('error', (e) => {
    cb(e)
  })
}

class BOSHServer extends EventEmitter {
  constructor(options) {
    super()
    this.options = options || {}
    this.nextRequestTimeout = this.options.nextRequestTimeout || NEXT_REQUEST_TIMEOUT

    // Set default cors properties
    if (!this.options.cors) {
      this.options.cors = {}
    }
    for (const i in this.corsHeaders) {
      if (typeof this.options.cors[i] === 'undefined') {
        this.options.cors[i] = this.corsHeaders[i]
      }
    }

    this.sessions = Object.create(null)

    const server = this.server = serverStop(this.options.server || http.createServer())
    server.on('request', this.onRequest.bind(this))
    server.on('close', this.emit.bind(this, 'close'))
    server.on('error', this.emit.bind(this, 'error'))
    server.on('listening', this.emit.bind(this, 'listening'))
  }

  setCorsHeader(req, res, options) {
    let { origin } = options
    if (Array.isArray(options.origin)) {
      origin = options.origin.indexOf(req.headers.origin) > -1 ? req.headers.origin : undefined
    } else if (options.origin === '*') {
      ({ origin } = req.headers)
    }

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    }
    res.setHeader('Access-Control-Allow-Credentials', options.credentials)
    res.setHeader('Access-Control-Allow-Methods', options.methods.join(', '))
    res.setHeader('Access-Control-Allow-Headers', options.headers.join(', '))
  }

  listen(...args) {
    this.server.listen(...args)
  }

  close(...args) {
    this.server.close(...args)
  }

  stop(...args) {
    this.server.stop(...args)
  }

  /**
   * *YOU* need to check the path before passing to this function.
   */
  onRequest(req, res) {
    debug('handle http')
    this.setCorsHeader(req, res, this.options.cors)
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
    } else if (req.method === 'POST') {
      this._handlePostRequest(req, res)
    } else {
      res.writeHead(405, {
        'Allow': 'OPTIONS, POST',
      })
      res.end()
    }
  }

  _handlePostRequest(req, res) {
    debug('handle POST request')
    const self = this
    parseBody(req, (error, bodyEl) => {
      if (error ||
        !bodyEl || !bodyEl.attrs || !bodyEl.is ||
        !bodyEl.is('body', NS_HTTPBIND)
      ) {
        return self._sendErrorResponse(res, error)
      }

      debug(`got: ${bodyEl.toString()}`)

      if (bodyEl.attrs.sid) {
        debug('sid found, reuse existing session')
        self._useExistingSession(req, res, bodyEl)
      } else {
        debug('no sid found, create a new session')
        self._createSession(req, res, bodyEl)
      }
    })
  }

  _sendErrorResponse(res, error) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })

    let body
    if (error instanceof Error) {
      body = error.message || error.stack
    } else if (typeof error === 'string') {
      body = error
    } else {
      body = 'error'
    }

    res.end(body)
  }

  _useExistingSession(req, res, bodyEl) {
    const session = this.sessions[bodyEl.attrs.sid]
    if (session) {
      debug('session for sid', bodyEl.attrs.sid, 'found', process.pid)
      session.handleHTTP(
        { req, res, bodyEl }
      )
      res.once('close', () => {
        session.closeSocket()
      })
    } else {
      debug('no session found for sid', bodyEl.attrs.sid, process.pid)
      res.writeHead(
        404, { 'Content-Type': 'text/plain' }
      )
      res.end('BOSH session not found')
    }
  }

  _createSession(req, res, bodyEl) {
    debug('create a new session')

    const self = this
    const session = new Socket({
      req,
      res,
      bodyEl,
      nextRequestTimeout: this.nextRequestTimeout,
    })
    this.sessions[session.sid] = session

    // Hook for destruction
    session.once('close', () => {
      delete self.sessions[session.sid]
    })

    res.boshAttrs = { 'xmpp:restartlogic': true }

    // Emit new connection
    this.emit('connection', session)
  }
}

BOSHServer.prototype.corsHeaders = {
  origin: '*',
  methods: [
    'POST',
    'OPTIONS',
  ],
  headers: [
    'X-Requested-With',
    'Content-Type',
    'Content-Length',
  ],
  credentials: false,
}

module.exports = BOSHServer
