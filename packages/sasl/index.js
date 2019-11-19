'use strict'

const {encode, decode} = require('@xmpp/base64')
const SASLError = require('./lib/SASLError')
const xml = require('@xmpp/xml')
const SASLFactory = require('saslmechanisms')

// https://xmpp.org/rfcs/rfc6120.html#sasl

const NS = 'urn:ietf:params:xml:ns:xmpp-sasl'

function getMechanismNames(features) {
  return features.getChild('mechanisms', NS).children.map(el => el.text())
}

async function authenticate(SASL, entity, mechname, credentials) {
  const mech = SASL.create([mechname])
  if (!mech) {
    throw new Error('No compatible mechanism')
  }

  const {domain} = entity.options
  const creds = {
    username: null,
    password: null,
    server: domain,
    host: domain,
    realm: domain,
    serviceType: 'xmpp',
    serviceName: domain,
    ...credentials,
  }

  return new Promise((resolve, reject) => {
    const handler = element => {
      if (element.attrs.xmlns !== NS) {
        return
      }

      if (element.name === 'challenge') {
        mech.challenge(decode(element.text()))
        const resp = mech.response(creds)
        entity.send(
          xml(
            'response',
            {xmlns: NS, mechanism: mech.name},
            typeof resp === 'string' ? encode(resp) : ''
          )
        )
        return
      }

      if (element.name === 'failure') {
        reject(SASLError.fromElement(element))
      } else if (element.name === 'success') {
        resolve()
      }

      entity.removeListener('nonza', handler)
    }

    entity.on('nonza', handler)

    if (mech.clientFirst) {
      entity.send(
        xml(
          'auth',
          {xmlns: NS, mechanism: mech.name},
          encode(mech.response(creds))
        )
      )
    }
  })
}

module.exports = function sasl({streamFeatures}, credentials) {
  const SASL = new SASLFactory()

  streamFeatures.use('mechanisms', NS, async ({stanza, entity}) => {
    const offered = getMechanismNames(stanza)
    const supported = SASL._mechs.map(({name}) => name)
    const intersection = supported.filter(mech => {
      return offered.includes(mech)
    })
    let mech = intersection[0]

    if (typeof credentials === 'function') {
      await credentials(
        creds => authenticate(SASL, entity, mech, creds, stanza),
        mech
      )
    } else {
      if (!credentials.username && !credentials.password) {
        mech = 'ANONYMOUS'
      }

      await authenticate(SASL, entity, mech, credentials, stanza)
    }

    await entity.restart()
  })

  return {
    use(...args) {
      return SASL.use(...args)
    },
  }
}
