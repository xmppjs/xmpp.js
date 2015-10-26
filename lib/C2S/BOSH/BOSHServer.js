'use strict'

require('es6-collections')
var EventEmitter = require('events').EventEmitter
var util = require('util')
var ltx = require('node-xmpp-core').ltx
var Socket = require('./Socket')
var debug = require('debug')('xmpp:bosh:http')
var http = require('http')
var serverStop = require('../../serverStop')

var NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'
var NEXT_REQUEST_TIMEOUT = 60 * 1000

function parseBody (stream, cb) {
  var parser = new ltx.Parser()
  stream.on('data', function (data) {
    parser.write(data)
  })
  stream.on('end', function () {
    parser.end()
  })
  stream.on('error', function (e) {
    cb(e)
  })
  parser.on('tree', function (bodyEl) {
    cb(null, bodyEl)
  })
  parser.on('error', function (e) {
    cb(e)
  })
}

function BOSHServer (options) {
  EventEmitter.call(this)
  this.options = options || {}
  this.nextRequestTimeout = this.options.nextRequestTimeout || NEXT_REQUEST_TIMEOUT

  // set default cors properties
  if (!this.options.cors) {
    this.options.cors = {}
  }
  for (var i in this.corsHeaders) {
    if (typeof this.options.cors[i] === 'undefined') {
      this.options.cors[i] = this.corsHeaders[i]
    }
  }

  this.sessions = Object.create(null)

  var server = this.server = serverStop(this.options.server || http.createServer())
  server.on('request', this.onRequest.bind(this))
  server.on('close', this.emit.bind(this, 'close'))
  server.on('error', this.emit.bind(this, 'error'))
  server.on('listening', this.emit.bind(this, 'listening'))
}

util.inherits(BOSHServer, EventEmitter)

BOSHServer.prototype.corsHeaders = {
  origin: '*',
  methods: [
    'POST',
    'OPTIONS'
  ],
  headers: [
    'X-Requested-With',
    'Content-Type',
    'Content-Length'
  ],
  credentials: false
}

BOSHServer.prototype.setCorsHeader = function (req, res, options) {
  var origin = options.origin
  if (Array.isArray(options.origin)) {
    origin = options.origin.indexOf(req.headers.origin) > -1 ? req.headers.origin : undefined
  } else if (options.origin === '*') {
    origin = req.headers.origin
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Credentials', options.credentials)
  res.setHeader('Access-Control-Allow-Methods', options.methods.join(', '))
  res.setHeader('Access-Control-Allow-Headers', options.headers.join(', '))
}

BOSHServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments)
}

BOSHServer.prototype.close = function () {
  this.server.close.apply(this.server, arguments)
}

BOSHServer.prototype.stop = function () {
  this.server.stop.apply(this.server, arguments)
}

/**
 * *YOU* need to check the path before passing to this function.
 */
BOSHServer.prototype.onRequest = function (req, res) {
  debug('handle http')
  this.setCorsHeader(req, res, this.options.cors)
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
  } else if (req.method === 'POST') {
    this._handlePostRequest(req, res)
  } else {
    res.writeHead(405, {
      'Allow': 'OPTIONS, POST'
    })
    res.end()
  }
}

BOSHServer.prototype._handlePostRequest = function (req, res) {
  debug('handle POST request')
  var self = this
  parseBody(req, function (error, bodyEl) {
    if (error ||
      !bodyEl || !bodyEl.attrs || !bodyEl.is ||
      !bodyEl.is('body', NS_HTTPBIND)
    ) {
      return self._sendErrorResponse(res, error)
    }

    debug('got: ' + bodyEl.toString())

    if (bodyEl.attrs.sid) {
      debug('sid found, reuse existing session')
      self._useExistingSession(req, res, bodyEl)
    } else {
      debug('no sid found, create a new session')
      self._createSession(req, res, bodyEl)
    }
  })
}

BOSHServer.prototype._sendErrorResponse = function (res, error) {
  res.writeHead(400, { 'Content-Type': 'text/plain' })

  var body
  if (error instanceof Error) {
    body = error.message || error.stack
  } else if (typeof error === 'string') {
    body = error
  } else {
    body = 'error'
  }

  res.end(body)
}

BOSHServer.prototype._useExistingSession = function (req, res, bodyEl) {
  var session = this.sessions[bodyEl.attrs.sid]
  if (session) {
    debug('session for sid', bodyEl.attrs.sid, 'found', process.pid)
    session.handleHTTP(
      { req: req, res: res, bodyEl: bodyEl }
    )
    res.once('close', function () {
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

BOSHServer.prototype._createSession = function (req, res, bodyEl) {
  debug('create a new session')

  var self = this
  var session = new Socket({
    req: req,
    res: res,
    bodyEl: bodyEl,
    nextRequestTimeout: this.nextRequestTimeout
  })
  this.sessions[session.sid] = session

  // Hook for destruction
  session.once('close', function () {
    delete self.sessions[session.sid]
  })

  res.boshAttrs = {'xmpp:restartlogic': true}

  // emit new connection
  this.emit('connection', session)
}

module.exports = BOSHServer
