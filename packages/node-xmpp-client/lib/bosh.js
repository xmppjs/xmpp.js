'use strict'

var EventEmitter = require('events').EventEmitter
var core = require('node-xmpp-core')
var inherits = core.inherits
var ltx = core.ltx
var request = require('request')
var debug = require('debug')('xmpp:client:bosh')

function BOSHConnection (opts) {
  var that = this
  EventEmitter.call(this)

  this.boshURL = opts.bosh.url
  this.jid = opts.jid
  this.wait = opts.bosh.wait || 60
  this.xmlnsAttrs = {
    xmlns: 'http://jabber.org/protocol/httpbind',
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
  this.currentRequests = 0
  this.queue = []
  this.rid = Math.ceil(Math.random() * 9999999999)

  this.request({
    to: this.jid.domain,
    ver: '1.6',
    wait: this.wait,
    hold: '1',
    content: this.contentType,
    'xmpp:version': '1.0'
  }, [], function (err, bodyEl) {
    if (err) {
      that.emit('error', err)
    } else if (bodyEl && bodyEl.attrs) {
      that.sid = bodyEl.attrs.sid
      that.maxRequests = parseInt(bodyEl.attrs.requests, 10) || 2
      if (that.sid && (that.maxRequests > 0)) {
        that.emit('connect')
        that.processResponse(bodyEl)
        process.nextTick(that.mayRequest.bind(that))
      } else {
        that.emit('error', 'Invalid parameters')
      }
    }
  })
}

inherits(BOSHConnection, EventEmitter)

BOSHConnection.prototype.contentType = 'text/xml; charset=utf-8'

BOSHConnection.prototype.send = function (stanza) {
  this.queue.push(stanza.root())
  process.nextTick(this.mayRequest.bind(this))
}

BOSHConnection.prototype.startStream = function () {
  var that = this

  this.rid++
  this.request({
    to: this.jid.domain,
    'xmpp:restart': 'true'
  },
    [],
    function (err, bodyEl) {
      if (err) {
        that.emit('error', err)
        that.emit('disconnect')
        that.emit('end')
        delete that.sid
        that.emit('close')
      } else {
        that.streamOpened = true
        if (bodyEl) that.processResponse(bodyEl)

        process.nextTick(that.mayRequest.bind(that))
      }
    })
}

BOSHConnection.prototype.processResponse = function (bodyEl) {
  debug('process bosh server response ' + bodyEl.toString())
  if (bodyEl && bodyEl.children) {
    for (var i = 0; i < bodyEl.children.length; i++) {
      var child = bodyEl.children[i]
      if (child.name && child.attrs && child.children) {
        this.emit('stanza', child)
      }
    }
  }
  if (bodyEl && (bodyEl.attrs.type === 'terminate')) {
    if (!this.shutdown || bodyEl.attrs.condition) {
      this.emit('error', new Error(bodyEl.attrs.condition || 'Session terminated'))
    }
    this.emit('disconnect')
    this.emit('end')
    this.emit('close')
  }
}

BOSHConnection.prototype.mayRequest = function () {
  var canRequest =
  /* Must have a session already */
  this.sid &&
    /* We can only receive when one request is in flight */
    ((this.currentRequests === 0) ||
    /* Is there something to send, and are we allowed? */
    (((this.queue.length > 0) && (this.currentRequests < this.maxRequests)))
  )

  if (!canRequest) return

  var stanzas = this.queue
  this.queue = []
  this.rid++
  this.request({}, stanzas, function (err, bodyEl) {
    if (err) {
      this.emit('error', err)
      this.emit('disconnect')
      this.emit('end')
      delete this.sid
      this.emit('close')
    } else {
      if (bodyEl) this.processResponse(bodyEl)

      process.nextTick(this.mayRequest.bind(this))
    }
  }.bind(this))
}

BOSHConnection.prototype.end = function (stanzas) {
  stanzas = stanzas || []
  if (typeof stanzas !== Array) stanzas = [stanzas]

  stanzas = this.queue.concat(stanzas)
  this.shutdown = true
  this.queue = []
  this.rid++
  this.request({ type: 'terminate' }, stanzas, function (err, bodyEl) {
    if (err) return
    else if (bodyEl) this.processResponse(bodyEl)

    this.emit('disconnect')
    this.emit('end')
    delete this.sid
    this.emit('close')
  }.bind(this))
}

BOSHConnection.prototype.maxHTTPRetries = 5

BOSHConnection.prototype.request = function (attrs, children, cb, retry) {
  var that = this
  retry = retry || 0

  attrs.rid = this.rid.toString()
  if (this.sid) attrs.sid = this.sid

  for (var k in this.xmlnsAttrs) {
    attrs[k] = this.xmlnsAttrs[k]
  }
  var boshEl = new ltx.Element('body', attrs)
  for (var i = 0; i < children.length; i++) {
    boshEl.cnode(children[i])
  }

  debug('send bosh request:' + boshEl.toString())

  request({
    uri: this.boshURL,
    method: 'POST',
    headers: { 'Content-Type': this.contentType },
    body: boshEl.toString()
  },
    function (err, res, body) {
      that.currentRequests--

      if (err) {
        if (retry < that.maxHTTPRetries) {
          return that.request(attrs, children, cb, retry + 1)
        } else {
          return cb(err)
        }
      }
      if ((res.statusCode < 200) || (res.statusCode >= 400)) {
        return cb(new Error('HTTP status ' + res.statusCode))
      }

      var bodyEl
      try {
        bodyEl = ltx.parse(body)
      } catch (e) {
        return cb(e)
      }

      if (bodyEl &&
        (bodyEl.attrs.type === 'terminate') &&
        bodyEl.attrs.condition) {
        cb(new Error(bodyEl.attrs.condition))
      } else if (bodyEl) {
        cb(null, bodyEl)
      } else {
        cb(new Error('no <body/>'))
      }
    }
  )
  this.currentRequests++
}

module.exports = BOSHConnection
