'use strict'

const resolve = require('@xmpp/resolve')

function sc(socket, params) {
  return new Promise((resolve, reject) => {
    socket.once('error', reject)
    socket.connect(params, () => {
      socket.removeListener('error', reject)
      resolve()
    })
  })
}

function getURIs(domain) {
  return resolve(domain, {
    srv: [
      {
        service: 'xmpps-client',
        protocol: 'tcp',
      },
      {
        service: 'xmpp-client',
        protocol: 'tcp',
      },
    ],
  })
    .then(records => {
      return records.map(record => record.uri).filter(record => record)
    })
    .then(uris => [...new Set(uris)])
}

function fallbackConnect(entity, uris) {
  const uri = uris.shift()
  let params
  const Transport = entity.transports.find(Transport => {
    try {
      params = Transport.prototype.socketParameters(uri)
      return params !== undefined
    } catch (err) {
      return false
    }
  })

  if (!Transport) {
    throw new Error('No compatible connection method found.')
  }

  const socket = new Transport.prototype.Socket()
  const parser = new Transport.prototype.Parser()
  return sc(socket, params)
    .then(() => {
      entity._attachParser(parser)
      entity._attachSocket(socket)
      socket.emit('connect')
      entity.Transport = Transport
      entity.Socket = Transport.prototype.Socket
      entity.Parser = Transport.prototype.Parser
    })
    .catch(() => {
      if (uris.length === 0) {
        return new Error("Couldn't connect")
      }
      return fallbackConnect(entity, uris)
    })
}

module.exports.name = 'resolve'
module.exports.plugin = function plugin(entity) {
  const _connect = entity.connect
  entity.connect = function connect(domain) {
    if (domain.length === 0 || domain.match(/:\/\//)) {
      return _connect.call(this, domain)
    }
    return getURIs(domain).then(uris => {
      return fallbackConnect(entity, uris)
    })
  }

  return {
    entity,
  }
}
