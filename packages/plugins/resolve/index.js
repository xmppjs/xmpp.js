'use strict'

const resolve = require('@xmpp/resolve')
const {socketConnect} = require('@xmpp/connection')

async function fetchURIs(domain) {
  return [
    // Remove duplicates
    ...new Set(
      (await resolve(domain, {
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
      })).map(record => record.uri)
    ),
  ]
}

function filterSupportedURIs(entity, uris) {
  return uris.filter(uri => entity._findTransport(uri))
}

async function fallbackConnect(entity, uris) {
  if (uris.length === 0) {
    throw new Error("Couldn't connect")
  }

  const uri = uris.shift()
  const Transport = entity._findTransport(uri)

  if (!Transport) {
    return fallbackConnect(entity, uris)
  }

  const params = Transport.prototype.socketParameters(uri)
  const socket = new Transport.prototype.Socket()

  try {
    await socketConnect(socket, params)
  } catch (err) {
    return fallbackConnect(entity, uris)
  }

  entity._attachSocket(socket)
  socket.emit('connect')
  entity.Transport = Transport
  entity.Socket = Transport.prototype.Socket
  entity.Parser = Transport.prototype.Parser
}

module.exports.name = 'resolve'
module.exports.plugin = function plugin(entity) {
  const _connect = entity.connect
  entity.connect = async function connect(domain) {
    if (domain.length === 0 || domain.match(/:\/\//)) {
      return _connect.call(this, domain)
    }

    const uris = filterSupportedURIs(entity, await fetchURIs(domain))

    if (uris.length === 0) {
      throw new Error('No compatible transport found.')
    }

    try {
      await fallbackConnect(entity, uris)
    } catch (err) {
      entity._reset()
      entity._status('disconnect')
      throw err
    }
  }

  return {
    entity,
  }
}
