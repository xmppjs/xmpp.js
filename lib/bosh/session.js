'use strict';

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , ltx = require('node-xmpp-core').ltx
  , hat = require('hat')

var NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'

/**
 * Gets constructed with a first HTTP request (opts.req & opts.res),
 * but receives more in method handleHTTP().
 */
function BOSHServerSession(opts) {
    this.setOptions(opts)
    this.reset()
    this.respond(opts.res, { sid: this.sid })
    this.maySetConnectionTimeout()
    // Let someone hook to 'connect' event before emitting 'streamStart'
    process.nextTick(this.startParser.bind(this))
    // if the server shuts down, we close all connections
    if (opts.server)
        opts.server.once('shutdown', this.end.bind(this))
}

util.inherits(BOSHServerSession, EventEmitter)

BOSHServerSession.prototype.setOptions = function(opts) {
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

    this.sid = opts.sid || hat()
    this.nextRid = parseInt(opts.bodyEl.attrs.rid, 10) + 1
    this.wait = parseInt(opts.bodyEl.attrs.wait || '30', 10)
    this.hold = parseInt(opts.bodyEl.attrs.hold || '1', 10)
}

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
    opts.timer = setTimeout(function() {
        delete opts.timer
        this.onReqTimeout(opts.bodyEl.attrs.rid)
    }.bind(this), this.wait * 1000)

    // Process...
    this.inQueue[opts.bodyEl.attrs.rid] = opts
    process.nextTick(this.workInQueue.bind(this))
}

BOSHServerSession.prototype.workInQueue = function() {
    if (!this.inQueue.hasOwnProperty(this.nextRid)) {
        // Still waiting for next rid request
        return
    }

    var opts = this.inQueue[this.nextRid]
    delete this.inQueue[this.nextRid]
    this.nextRid++

    opts.bodyEl.children.forEach(this.emit.bind(this, 'stanza'))

    // Input process, retain response for sending stanzas
    this.outQueue.push(opts)

    if (opts.bodyEl.attrs.type !== 'terminate') {
        process.nextTick(function() {
            this.workOutQueue()
            this.workInQueue()
        }.bind(this))
    } else {
        for (var i = 0; i < this.outQueue.length; i++) {
            opts = this.outQueue[i]
            if (opts.timer) clearTimeout(opts.timer)
            this.respond(opts.res, { type: 'terminate' }, [])
        }
        this.end()
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
        this.connectionTimeout = setTimeout(function() {
            this.emit('error', new Error('Session timeout'))
            this.emit('close')
        }.bind(this), 60 * 1000)
    }
}

BOSHServerSession.prototype.send = function(stanza) {
    this.stanzaQueue.push(stanza.root())

    process.nextTick(this.workOutQueue.bind(this))
    // indicate if we flush:
    return this.outQueue.length > 0
}

BOSHServerSession.prototype.reset = function() {
    this.inQueue = {}
    this.outQueue = []
    this.stanzaQueue = []
    this.emit('reset')
}

BOSHServerSession.prototype.end = function() {
    this.emit('end')
    this.reset()
    this.emit('close')
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

BOSHServerSession.Session = BOSHServerSession
module.exports = BOSHServerSession
