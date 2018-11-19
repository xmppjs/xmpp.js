'use strict'

const {Socket} = require('net')
const Connection = require('@xmpp/connection')
const {Parser} = require('@xmpp/xml')
const {URL} = require('url')

const NS_STREAM = 'http://etherx.jabber.org/streams'

/* References
 * Extensible Messaging and Presence Protocol (XMPP): Core http://xmpp.org/rfcs/rfc6120.html
 */

class ConnectionTCP extends Connection {
  socketParameters(service) {
    const {port, hostname, protocol} = new URL(service)
    return protocol === 'xmpp:'
      ? {port: port ? Number(port) : null, host: hostname}
      : undefined
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  headerElement() {
    const el = super.headerElement()
    el.name = 'stream:stream'
    el.attrs['xmlns:stream'] = NS_STREAM
    return el
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  header(el) {
    const frag = el.toString()
    return `<?xml version='1.0'?>` + frag.substr(0, frag.length - 2) + '>'
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-close
  footer() {
    return '</stream:stream>'
  }
}

ConnectionTCP.prototype.NS = NS_STREAM
ConnectionTCP.prototype.Socket = Socket
ConnectionTCP.prototype.Parser = Parser

module.exports = ConnectionTCP
