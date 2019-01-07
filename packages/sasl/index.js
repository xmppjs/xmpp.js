'use strict'

const {encode, decode} = require('./lib/b64')
const SASLError = require('./lib/SASLError')
const xml = require('@xmpp/xml')
const SASLFactory = require('saslmechanisms')

// https://xmpp.org/rfcs/rfc6120.html#sasl

const NS = 'urn:ietf:params:xml:ns:xmpp-sasl'

function getMechanismNames(features) {
  return features.getChild('mechanisms', NS).children.map(el => el.text())
}

function findMechanism(SASL, name) {
  return SASL.create([name])
}

async function handleMechanism(SASL, entity, mech, features, credentials) {
  if (typeof credentials === 'function') {
    await credentials(
      creds => authenticate(SASL, entity, mech, creds, features),
      mech
    )
  } else {
    await authenticate(SASL, entity, mech, credentials, features)
  }
}

function gotFeatures(SASL, entity, features, credentials) {
  const offered = getMechanismNames(features)
  const supported = SASL._mechs.map(({name}) => name)
  const intersection = supported.filter(mech => {
    return offered.includes(mech)
  })
  const mech = intersection[0]

  return handleMechanism(SASL, entity, mech, features, credentials)
}

// eslint-disable-next-line require-await
async function authenticate(SASL, entity, mechname, credentials) {
  const mech = findMechanism(SASL, mechname)
  if (!mech) {
    throw new Error('No compatible mechanism')
  }

  const {domain} = entity.options
  const creds = Object.assign(
    {
      username: null,
      password: null,
      server: domain,
      host: domain,
      realm: domain,
      serviceType: 'xmpp',
      serviceName: domain,
    },
    credentials
  )

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
    try {
      await gotFeatures(SASL, entity, stanza, credentials)
      await entity.restart()
    } catch (err) {
      throw err
    }
  })

  return {
    use(...args) {
      return SASL.use(...args)
    },
  }
}
