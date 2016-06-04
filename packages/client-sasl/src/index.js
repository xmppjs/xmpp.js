'use strict'

import SASLFactory from 'saslmechanisms'
import {encode, decode} from './lib/b64'

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
        client.send(
          <response xmlns={NS} mechanism={mech.name}>
            {typeof resp === 'string' ? encode(resp) : ''}
          </response>
        )
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
      client.send(
        <auth xmlns={NS} mechanism={mech.name}>
          {encode(mech.response(creds))}
        </auth>
      )
    }
  })
}

function match (features, client) {
  return features.getChild('mechanisms', NS)
}

function plugin (client) {
  client.SASL = new SASLFactory()

  if (client.registerStreamFeature) {
    client.registerStreamFeature(streamFeature)
  }
}

const streamFeature = {
  priority: 1000,
  match,
  restart: true,
  run: (client, features) => {
    const credentials = {
      username: client.options.username,
      password: client.options.password
    }
    return authenticate(client, credentials, features)
  }
}

export default {NS, getBestMechanism, authenticate, match, plugin, streamFeature}
