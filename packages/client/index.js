'use strict'

const {xml, jid, Client} = require('@xmpp/client-core')

const reconnect = require('@xmpp/reconnect')
const tcp = require('@xmpp/tcp')
const websocket = require('@xmpp/websocket')
const tls = require('@xmpp/tls')
const packages = {reconnect, tcp, websocket, tls}

const _middleware = require('@xmpp/middleware')
const _streamFeatures = require('@xmpp/stream-features')

const _iqCaller = require('@xmpp/iq/caller')
const resolve = require('@xmpp/resolve')

// Stream features - order matters and define priority
const _starttls = require('@xmpp/starttls/client')
const _sasl = require('@xmpp/sasl')
const _resourceBinding = require('@xmpp/resource-binding')
const _sessionEstablishment = require('@xmpp/session-establishment')

// SASL mechanisms - order matters and define priority
const anonymous = require('@xmpp/sasl-anonymous')
const scramsha1 = require('@xmpp/sasl-scram-sha-1')
const plain = require('@xmpp/sasl-plain')

function xmpp(options = {}) {
  const {resource, credentials} = options

  const client = new Client(options)
  resolve({entity: client})
  const middleware = _middleware(client)
  const streamFeatures = _streamFeatures(middleware)
  const iqCaller = _iqCaller({middleware, entity: client})

  // Stream features - order matters and define priority
  const starttls =
    typeof _starttls === 'function' ? _starttls({streamFeatures}) : undefined
  const sasl = _sasl({streamFeatures}, credentials)
  const resourceBinding = _resourceBinding({iqCaller, streamFeatures}, resource)
  const sessionEstablishment = _sessionEstablishment({iqCaller, streamFeatures})

  // SASL mechanisms - order matters and define priority
  const mechanisms = Object.entries({anonymous, scramsha1, plain})
    // Ignore browserify stubs
    .filter(([, v]) => typeof v === 'function')
    .map(([k, v]) => ({[k]: v(sasl)}))

  const exports = Object.assign(
    {
      client,
      entity: client,
      middleware,
      streamFeatures,
      iqCaller,
      starttls,
      sasl,
      resourceBinding,
      sessionEstablishment,
    },
    // ...features,
    ...mechanisms,
    ...Object.entries(packages)
      // Ignore browserify stubs
      .filter(([, v]) => typeof v === 'function')
      .map(([k, v]) => ({[k]: v(client)}))
  )

  return exports
}

module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid
module.exports.xmpp = xmpp
