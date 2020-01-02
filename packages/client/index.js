'use strict'

const {xml, jid, Client} = require('@xmpp/client-core')
const getDomain = require('./lib/getDomain')

const _reconnect = require('@xmpp/reconnect')
const _websocket = require('@xmpp/websocket')
const _tcp = require('@xmpp/tcp')
const _tls = require('@xmpp/tls')
const _middleware = require('@xmpp/middleware')
const _streamFeatures = require('@xmpp/stream-features')
const _iqCaller = require('@xmpp/iq/caller')
const _iqCallee = require('@xmpp/iq/callee')
const _resolve = require('@xmpp/resolve')

// Stream features - order matters and define priority
const _starttls = require('@xmpp/starttls/client')
const _sasl = require('@xmpp/sasl')
const _resourceBinding = require('@xmpp/resource-binding')
const _sessionEstablishment = require('@xmpp/session-establishment')

// SASL mechanisms - order matters and define priority
const scramsha1 = require('@xmpp/sasl-scram-sha-1')
const plain = require('@xmpp/sasl-plain')
const anonymous = require('@xmpp/sasl-anonymous')

function client(options = {}) {
  const {resource, credentials, username, password, ...params} = options

  const {domain, service} = params
  if (!domain && service) {
    params.domain = getDomain(service)
  }

  const entity = new Client(params)

  const reconnect = _reconnect({entity})
  const websocket = _websocket({entity})
  const tcp = _tcp({entity})
  const tls = _tls({entity})

  const middleware = _middleware({entity})
  const streamFeatures = _streamFeatures({middleware})
  const iqCaller = _iqCaller({middleware, entity})
  const iqCallee = _iqCallee({middleware, entity})
  const resolve = _resolve({entity})
  // Stream features - order matters and define priority
  const starttls = _starttls({streamFeatures})
  const sasl = _sasl({streamFeatures}, credentials || {username, password})
  const resourceBinding = _resourceBinding({iqCaller, streamFeatures}, resource)
  const sessionEstablishment = _sessionEstablishment({iqCaller, streamFeatures})
  // SASL mechanisms - order matters and define priority
  const mechanisms = Object.entries({
    scramsha1,
    plain,
    anonymous,
  }).map(([k, v]) => ({[k]: v(sasl)}))

  return Object.assign(entity, {
    entity,
    reconnect,
    tcp,
    websocket,
    tls,
    middleware,
    streamFeatures,
    iqCaller,
    iqCallee,
    resolve,
    starttls,
    sasl,
    resourceBinding,
    sessionEstablishment,
    mechanisms,
  })
}

module.exports.xml = xml
module.exports.jid = jid
module.exports.client = client
