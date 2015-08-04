'use strict'

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , ltx = require('node-xmpp-core').ltx
  , BOSHServerSession = require('./session')
  , debug = require('debug')('xmpp:bosh:http')

var NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'

function parseBody(stream, cb) {
    var parser = new ltx.Parser()
    stream.on('data', function(data) {
        parser.write(data)
    })
    stream.on('end', function() {
        parser.end()
    })
    stream.on('error', function(e) {
        cb(e)
    })
    parser.on('tree', function(bodyEl) {
        cb(null, bodyEl)
    })
    parser.on('error', function(e) {
        cb(e)
    })
}

function BOSHServer(options) {
    this.options = options || {}

    // set default cors properties
    if (!this.options.cors) {
        this.options.cors = {}
    }
    for (var i in this.corsHeaders) {
        if (typeof this.options.cors[i] === 'undefined')
            this.options.cors[i] = this.corsHeaders[i]
    }

    this.sessions = Object.create(null)
}

util.inherits(BOSHServer, EventEmitter)

BOSHServer.prototype.corsHeaders = {
    origin : '*',
    methods: [
        'POST',
        'OPTIONS'
    ],
    headers: [
        'X-Requested-With',
        'Content-Type',
        'Content-Length',
    ],
    credentials: false
}

BOSHServer.prototype.setCorsHeader = function(req, res, options) {
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

/**
 * *YOU* need to check the path before passing to this function.
 */
BOSHServer.prototype.handleHTTP = function(req, res) {
    debug('handle http')
    this.setCorsHeader(req, res, this.options.cors)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
    } else if (req.method === 'POST') {
        this._handlePostRequest(req, res)
    } else {
        debug('http method is not POST')
        res.writeHead(400)
        res.end()
    }
}

BOSHServer.prototype._handlePostRequest = function(req, res) {
    debug('handle POST request')
    var self = this
    parseBody(req, function(error, bodyEl) {
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

BOSHServer.prototype._sendErrorResponse = function(res, error) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    res.end(error.message || error.stack || 'Error')
}

BOSHServer.prototype._useExistingSession = function(req, res, bodyEl) {
    var session = this.sessions[bodyEl.attrs.sid]
    if (session) {
        session.handleHTTP(
            { req: req, res: res, bodyEl: bodyEl }
        )
        res.once('close', function () {
            session.closeSocket()
        })
    } else {
        res.writeHead(
            404, { 'Content-Type': 'text/plain' }
        )
        res.end('BOSH session not found')
    }

    req.socket.once('timeout', function() {
        req.socket.end()
        if (session) {
            session.closeSocket()
        }
    })
}

BOSHServer.prototype._createSession = function(req, res, bodyEl) {
    debug('create a new session')

    /* No sid: create session */
    var self = this
    var session
    do {
        session = new BOSHServerSession(
            { req: req, res: res, bodyEl: bodyEl }
        )
    } while (this.sessions[session.sid])
    this.sessions[session.sid] = session
    /* Hook for destruction */
    session.on('close', function() {
        delete self.sessions[session.sid]
    })

    res.boshAttrs = {'xmpp:restartlogic': true}

    // emit new connection
    this.emit('connect', session)
}

module.exports = BOSHServer
