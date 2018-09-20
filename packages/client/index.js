'use strict'

const {xml, jid, Client} = require('@xmpp/client-core')

const reconnect = require('@xmpp/reconnect')
const tcp = require('@xmpp/tcp')
const websocket = require('@xmpp/websocket')
const tls = require('@xmpp/tls')
const packages = {reconnect, tcp, websocket, tls}

const _middleware = require('@xmpp/middleware')
const _router = require('@xmpp/router')
const _streamFeatures = require('@xmpp/stream-features')

const _iqCaller = require('@xmpp/iq/caller')
const resolve = require('@xmpp/resolve')

// Stream features - order matters and define priority
const starttls = require('@xmpp/starttls')
const sasl = require('@xmpp/sasl')
const resourceBinding = require('@xmpp/resource-binding')
const sessionEstablishment = require('@xmpp/session-establishment')

// SASL mechanisms - order matters and define priority
const anonymous = require('@xmpp/sasl-anonymous')
const scramsha1 = require('@xmpp/sasl-scram-sha-1')
const plain = require('@xmpp/sasl-plain')
const _mechanisms = {anonymous, scramsha1, plain}

function xmpp(options = {}) {
  const {resource} = options

  const client = new Client()
  resolve({entity: client})
  const middleware = _middleware(client)
  const router = _router(middleware)
  const streamFeatures = _streamFeatures(middleware)

  const iqCaller = _iqCaller({middleware, entity: client})

  const _sasl = sasl()

  if (starttls.streamFeature) {
    streamFeatures.use(...starttls.streamFeature())
  }
  router.use('stream:features', _sasl.route())
  resourceBinding({iqCaller, streamFeatures}, resource)
  router.use('stream:features', sessionEstablishment({iqCaller}))

  const mechanisms = Object.entries(_mechanisms)
    // Ignore browserify stubs
    .filter(([, v]) => typeof v === 'function')
    .map(([k, v]) => ({[k]: v(_sasl)}))

  const exports = Object.assign(
    {
      client,
      middleware,
      router,
      sasl,
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
