'use strict'

const SASLFactory = require('saslmechanisms')
const {encode, decode} = require('./lib/b64')
const xml = require('@xmpp/xml')
const streamfeatures = require('../stream-features')

const NS = 'urn:ietf:params:xml:ns:xmpp-sasl'

function getBestMechanism (SASL, mechs, features) {
  // FIXME preference order ?
  // var SASL = new SASLFactory()
  // mechs.forEach((mech) => {
  //   if (typeof mech === 'string') {
  //     const existingMech = SASL_MECHS[mech.toLowerCase()]
  //     if (existingMech) {
  //       SASL.use(existingMech)
  //     }
  //   } else {
  //     SASL.use(mech)
  //   }
  // })

  const mechanisms = features.getChild('mechanisms', NS).children.map(el => el.text())
  return SASL.create(mechanisms)
}

function authenticate (client, credentials, features) {
  const mech = getBestMechanism(client.SASL, client.options.sasl, features)
  if (!mech) return Promise.reject('no compatible mechanism')
  const {domain} = client.options
  const creds = {}
  Object.assign(creds, {
    username: null,
    password: null,
    server: domain,
    host: domain,
    realm: domain,
    serviceType: 'xmpp',
    serviceName: domain
  }, credentials)

  return new Promise((resolve, reject) => {
    const handler = (element) => {
      if (element.attrs.xmlns !== NS) return

      if (element.name === 'challenge') {
        mech.challenge(decode(element.text()))
        const resp = mech.response(creds)
        client.send(xml`
          <response xmlns='${NS}' mechanism='${mech.name}'>
            ${typeof resp === 'string' ? encode(resp) : ''}
          </response>
        `)
        return
      }

      if (element.name === 'failure') {
        reject()
      } else if (element.name === 'success') {
        resolve()
      }

      client.removeListener('nonza', handler)
    }
    client.on('nonza', handler)

    if (mech.clientFirst) {
      client.send(xml`
        <auth xmlns='${NS}' mechanism='${mech.name}'>
          ${encode(mech.response(creds))}
        </auth>
      `)
    }
  })
}

function match (features) {
  return features.getChild('mechanisms', NS)
}

const streamFeature = {
  priority: 1000,
  match,
  restart: true,
  run: (entity, features) => {
    return new Promise((resolve, reject) => {
      const {username, password} = entity.options

      function auth (username, password) {
        return authenticate(entity, {username, password}, features)
          .then(() => {
            entity._authenticated()
            resolve()
          })
          .catch(reject)
      }

      if (username && password) {
        auth(username, password)
      } else {
        entity.emit('authenticate', auth)
      }
    })
  }
}

module.exports.name = 'sasl'
module.exports.plugin = function plugin (entity) {
  const streamFeatures = entity.plugin(streamfeatures)
  streamFeatures.add(streamFeature)

  const SASL = new SASLFactory()
  entity.SASL = SASL // FIXME

  return {
    entity,
    use (...args) {
      SASL.use(...args)
    }
  }
}
