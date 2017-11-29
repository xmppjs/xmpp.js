'use strict'

const entries = Object.entries || require('object.entries') // eslint-disable-line node/no-unsupported-features

const Client = require('./lib/Client')
const {xml, jid} = require('@xmpp/client-core')

const reconnect = require('@xmpp/reconnect')
const tcp = require('@xmpp/tcp')
const websocket = require('@xmpp/websocket')
const tls = require('@xmpp/tls')
const packages = {reconnect, tcp, websocket, tls}

const _middleware = require('@xmpp/middleware')
const _router = require('@xmpp/router')
const _streamFeatures = require('@xmpp/stream-features')
const _bind = require('@xmpp/bind')
const _sasl = require('@xmpp/sasl')

const _saslPlain = require('@xmpp/sasl-plain')
const _saslScramSha1 = require('@xmpp/sasl-scram-sha-1')
const _saslAnonymous = require('@xmpp/sasl-anonymous')

const _sessionEstablishment = require('@xmpp/session-establishment')
const _starttls = require('@xmpp/starttls')

function xmpp() {
  const client = new Client()
  const middleware = _middleware(client)
  const router = _router(middleware)
  const streamFeatures = _streamFeatures(router)
  const bind = _bind(streamFeatures)
  const sasl = _sasl(streamFeatures)
  const saslPlain = _saslPlain(sasl)
  const saslScramSha1 = _saslScramSha1(sasl)
  const saslAnonymous = _saslAnonymous(sasl)
  const sessionEstablishment = _sessionEstablishment(streamFeatures)
  const starttls = _starttls(streamFeatures)
  return Object.assign(
    {
      client,
      middleware,
      router,
      streamFeatures,
      bind,
      sasl,
      saslPlain,
      saslScramSha1,
      saslAnonymous,
      sessionEstablishment,
      starttls,
    },
    ...entries(packages)
      // Ignore browserify stubs
      .filter(([, v]) => typeof v === 'function')
      .map(([k, v]) => ({[k]: v(client)}))
  )
}

module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid
module.exports.xmpp = xmpp
