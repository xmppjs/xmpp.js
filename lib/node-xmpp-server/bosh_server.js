'use strict';

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , ltx = require('ltx')


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

/**
 * Sessions are stored *in memory!* You wouldn't want that for very
 * large setups.
 */
function BOSHServer() {
    this.sessions = {}
}

util.inherits(BOSHServer, EventEmitter)

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
    var self = this
    parseBody(req, function(error, bodyEl) {
        if (error ||
            !bodyEl || !bodyEl.attrs || !bodyEl.is ||
            !bodyEl.is('body', NS_HTTPBIND)
        ) {
            self._sendErrorResponse(res, error)
        }

        if (bodyEl.attrs.sid) {
            return self._useExistingSession(req, res, bodyEl)
        }
        self._createSession(req, res, bodyEl)
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
    } else {
        res.writeHead(
            404, { 'Content-Type': 'text/plain' }
        )
        res.end('BOSH session not found')
    }
}

BOSHServer.prototype._createSession = function(req, res, bodyEl) {
    /* No sid: create session */
    var self = this
    var session
    do {
        session = new BOSHServerSession(
            { req: req, res: res, bodyEl: bodyEl }
        )
    } while (this.sessions.hasOwnProperty(session.sid))
    this.sessions[session.sid] = session
    /* Hook for destruction */
    session.on('close', function() {
        delete self.sessions[session.sid]
    })
    this.emit('connect', session)
}

function generateSid() {
    var sid = ''
    for (var i = 0; i < 32; i++) {
        sid += String.fromCharCode(48 + Math.floor(Math.random() * 10))
    }
    return sid
}

/**
 * Gets constructed with a first HTTP request (opts.req & opts.res),
 * but receives more in method handleHTTP().
 */
function BOSHServerSession(opts) {
    this.xmlnsAttrs = {
        xmlns: NS_HTTPBIND,
        'xmlns:xmpp': 'urn:xmpp:xbosh',
        'xmlns:stream': 'http://etherx.jabber.org/streams'
    }
    if (opts.xmlns) {
        for (var prefix in opts.xmlns) {
            if (prefix) {
                this.xmlnsAttrs['xmlns:' + prefix] = opts.xmlns[prefix]
            } else {
                this.xmlnsAttrs.xmlns = opts.xmlns[prefix]
            }
        }
    }
    this.streamAttrs = opts.streamAttrs || {}
    this.handshakeAttrs = opts.bodyEl.attrs

    this.sid = generateSid()
    this.nextRid = parseInt(opts.bodyEl.attrs.rid, 10) + 1
    this.wait = parseInt(opts.bodyEl.attrs.wait || '30', 10)
    this.hold = parseInt(opts.bodyEl.attrs.hold || '1', 10)
    this.inQueue = {}
    this.outQueue = []
    this.stanzaQueue = []

    this.respond(opts.res, { sid: this.sid })

    this.maySetConnectionTimeout()

    // Let someone hook to 'connect' event before emitting 'streamStart'
    process.nextTick(this.startParser.bind(this))
}

util.inherits(BOSHServerSession, EventEmitter)

/* Should cause <stream:features/> to be sent. */
BOSHServerSession.prototype.startParser = function() {
    this.emit('streamStart', this.handshakeAttrs)
}

BOSHServerSession.prototype.handleHTTP = function(opts) {
    if (this.inQueue.hasOwnProperty(opts.bodyEl.attrs.rid)) {
        // Already queued? Replace with this request
        var oldOpts = this.inQueue[opts.bodyEl.attrs.rid]
        oldOpts.res.writeHead(
            403,
            { 'Content-Type': 'text/plain' }
        )
        oldOpts.res.end('Request replaced by same RID')
    } else if (parseInt(opts.bodyEl.attrs.rid, 10) < parseInt(this.nextRid, 10)) {
        // This req has already been processed.
        this.outQueue.push(opts)
        return
    }

    if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout)
        delete this.connectionTimeout
    }

    // Set up timeout:
    var self = this
    opts.timer = setTimeout(function() {
        delete opts.timer
        self.onReqTimeout(opts.bodyEl.attrs.rid)
    }, this.wait * 1000)

    // Process...
    this.inQueue[opts.bodyEl.attrs.rid] = opts
    process.nextTick(this.workInQueue.bind(this))
}

BOSHServerSession.prototype.workInQueue = function() {
    if (!this.inQueue.hasOwnProperty(this.nextRid)) {
        // Still waiting for next rid request
        return
    }

    var self = this
    var opts = this.inQueue[this.nextRid]
    delete this.inQueue[this.nextRid]
    this.nextRid++

    opts.bodyEl.children.forEach(function(stanza) {
        self.emit('stanza', stanza)
    })

    // Input process, retain response for sending stanzas
    this.outQueue.push(opts)

    if (opts.bodyEl.attrs.type !== 'terminate') {
        process.nextTick(function() {
            self.workOutQueue()
            self.workInQueue()
        })
    } else {
        for (var i = 0; i < this.outQueue.length; i++) {
            opts = this.outQueue[i]
            if (opts.timer) clearTimeout(opts.timer)
            this.respond(opts.res, { type: 'terminate' }, [])
        }
        this.outQueue = []
        this.emit('end')
        this.emit('close')
    }
}

BOSHServerSession.prototype.workOutQueue = function() {
    if ((this.stanzaQueue.length < 1) &&
        (this.outQueue.length > 0)) {
        this.emit('drain')
        return
    } else if (this.outQueue.length < 1) {
        return
    }
    var stanzas = this.stanzaQueue
    this.stanzaQueue = []
    var opts = this.outQueue.shift()

    if (opts.timer) {
        clearTimeout(opts.timer)
        delete opts.timer
    }

    this.respond(opts.res, {}, stanzas)

    this.maySetConnectionTimeout()
}

BOSHServerSession.prototype.maySetConnectionTimeout = function() {
    if (this.outQueue.length < 1) {
        var self = this
        this.connectionTimeout = setTimeout(function() {
            self.emit('error', new Error('Session timeout'))
            self.emit('close')
        }, 60 * 1000)
    }
}

BOSHServerSession.prototype.send = function(stanza) {
    this.stanzaQueue.push(stanza.root())

    process.nextTick(this.workOutQueue.bind(this))
    // indicate if we flush:
    return this.outQueue.length > 0
}

BOSHServerSession.prototype.onReqTimeout = function(rid) {
    var opts
    if ((opts = this.inQueue[rid])) {
        delete this.inQueue[rid]
    } else {
        for (var i = 0; i < this.outQueue.length; i++) {
            if (this.outQueue[i].bodyEl.attrs.rid === rid) break
        }

        if (i < this.outQueue.length) {
            opts = this.outQueue[i]
            this.outQueue.splice(i, 1)
        } else {
            console.warn('Spurious timeout for BOSH rid', rid)
            return
        }
    }
    this.respond(opts.res, {})
}

BOSHServerSession.prototype.respond = function(res, attrs, children) {
    res.writeHead(
        200,
        { 'Content-Type': 'application/xml; charset=utf-8' }
    )
    for (var k in this.xmlnsAttrs) {
        attrs[k] = this.xmlnsAttrs[k]
    }
    var bodyEl = new ltx.Element('body', attrs)
    if (children)
        children.forEach(bodyEl.cnode.bind(bodyEl))
    bodyEl.write(function(s) {
        res.write(s)
    })
    res.end()
}

exports.BOSHServer = BOSHServer