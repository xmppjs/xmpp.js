'use strict'

const xml = require('@xmpp/xml')

const {NS_DISCO_INFO} = require('.')

function build(features = [], identities = []) {
  return xml(
    'query',
    {xmlns: NS_DISCO_INFO},
    [...features].map(f => xml('feature', {var: f})),
    [...identities].map(i => xml('identity', i))
  )
}

module.exports = function({iqCallee}) {
  const features = new Set([NS_DISCO_INFO])
  const identities = new Set()

  iqCallee.get(NS_DISCO_INFO, () => {
    return build(features, identities)
  })

  return {
    features,
    identities,
  }
}

module.exports.build = build
