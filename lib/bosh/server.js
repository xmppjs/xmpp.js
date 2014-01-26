'use strict';

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , ltx = require('ltx')
  , hat = require('hat')
  , BOSHServerSession = require('./session')

var NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'

function parseBody(stream, cb) {
    var parser = new ltx.Parser()
    stream.on('data', function(data) {
        parser.write(data)
    })
    stream.on('end', function() {
        parser.end()
    })
    parser.on('tree', function(bodyEl) {
        cb(null, bodyEl)
    })
    stream.on('error', cb)
    parser.on('error', cb)
}

/**
 * Sessions are stored *in memory!* You wouldn't want that for very
 * large setups.
 */
function BOSHServer(opts) {
    opts = opts || {}
    this.sessions = {}
    this.server = opts.server
    this.generateSid = hat.rack(opts.sidBits, opts.sidBitsBase, opts.sidBitsExpandBy)
}

util.inherits(BOSHServer, EventEmitter)

BOSHServer.prototype.shutdown = function (callback) {
    this.emit('shutdown')

    if (this.server)
        this.server.close(callback)
    else if (callback)
        callback()
}

/**
 * *YOU* need to check the path before passing to this function.
 */
BOSHServer.prototype.handleHTTP = function(req, res) {
    if (req.method === 'POST') {
        this._handlePostRequest(req, res)
    //} else if (false && req.method === 'PROPFIND') {
    /* TODO: CORS preflight request */
    } else {
        res.writeHead(400)
        res.end()
    }
}

BOSHServer.prototype._handlePostRequest = function(req, res) {
    parseBody(req, function(error, bodyEl) {
        if (error ||
            !bodyEl || !bodyEl.attrs || !bodyEl.is ||
            !bodyEl.is('body', NS_HTTPBIND)
        ) {
            this._sendErrorResponse(res, error)
        }

        if (bodyEl.attrs.sid) {
            return this._useExistingSession(req, res, bodyEl)
        }
        this._createSession(req, res, bodyEl)
    }.bind(this))
}

BOSHServer.prototype._sendErrorResponse = function(res, error) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    res.end(error.message || error.stack || 'Error')
}

BOSHServer.prototype._useExistingSession = function(req, res, bodyEl) {
    var session = this.sessions[bodyEl.attrs.sid]
    if (session) {
        session.handleHTTP({ req: req, res: res, bodyEl: bodyEl })
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('BOSH session not found')
    }
}

BOSHServer.prototype._createSession = function(req, res, bodyEl) {
    var session = new BOSHServerSession({
        sid: this.generateSid(),
        req: req,
        res: res,
        bodyEl: bodyEl,
        server: this
    })
    this.sessions[session.sid] = session
    /* Hook for destruction */
    session.on('close', function() {
        delete this.sessions[session.sid]
    }.bind(this))
    this.emit('connect', session)
}

module.exports = BOSHServer
