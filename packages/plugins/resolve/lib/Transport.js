'use strict'

const resolve = require('@xmpp/resolve')
const url = require('url')
const Connection = require('@xmpp/connection')

class ResolveTransport extends Connection {
  _next (uris) {
    const uri = uris.shift()

    let params
    const Transport = this.entity.transports.find(Transport => {
      return params = Transport.match(uri) // eslint-disable-line no-return-assign
    })

    if (!Transport) throw new Error('No compatible connection method found.')

    const transport = this.transport = new Transport()

    // FIXME avoid - "throw er; // Unhandled 'error' event" WHY?
    // function onError(err) {
    //   console.log('lol')
    //   this.emit('error', err)
    // }
    // transport.on('error', onError)
    this.NS = transport.NS
    this._attachSocket(transport.socket)

    // console.log(this.transport)

    return this.transport.connect(params).catch((err) => {
      console.log('error', err)
      // transport.removeListener('error', onError)
      this._detachSocket(transport.socket)
      delete this.transport
      this._next(uris)
    })
  }

  connect (domain) {
    return resolve.http.resolve(domain).then((records) => {
      // records[0].uri = 'ws://foobar'
      const uris = records.map((record) => record.uri)
      this._next(uris)
    })
  }

  header(...args) {
    return this.transport.header(...args)
  }

  footer(...args) {
    return this.transport.footer(...args)
  }

  responseHeader(...args) {
    return this.transport.responseHeader(...args)
  }

  static match (uri) {
    try {
      const {protocol, hostname, port, slashes, pathname} = url.parse(uri)
      if (slashes || port || protocol || hostname) return false
      return uri
    } catch (err) {
      return false
    }
  }
}

module.exports = ResolveTransport
