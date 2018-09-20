'use strict'

const {encode, decode} = require('./lib/b64')
const xml = require('@xmpp/xml')
const {XMPPError} = require('@xmpp/connection')
const SASLFactory = require('saslmechanisms')

const NS = 'urn:ietf:params:xml:ns:xmpp-sasl'

class SASLError extends XMPPError {
  constructor(...args) {
    super(...args)
    this.name = 'SASLError'
  }
}

function match(features) {
  return features.getChild('mechanisms', NS)
}

function getMechanismNames(features) {
  return features.getChild('mechanisms', NS).children.map(el => el.text())
}

module.exports = function sasl() {
  const SASL = new SASLFactory()

  function getUsableMechanisms(mechs) {
    const supported = getAvailableMechanisms()
    return mechs.filter(mech => {
      return supported.indexOf(mech) > -1
    })
  }

  function getAvailableMechanisms() {
    return SASL._mechs.map(({name}) => name)
  }

  function getMechanism(usable) {
    return usable[0] // FIXME prefer SHA-1, ... maybe order usable, available, ... by preferred?
  }

  function gotFeatures(entity, features) {
    const offered = getMechanismNames(features)
    const usable = getUsableMechanisms(offered)
    // FIXME const available = this.getAvailableMechanisms()

    return Promise.resolve(getMechanism(usable)).then(mech => {
      return handleMechanism(entity, mech, features)
    })
  }

  function findMechanism(name) {
    return SASL.create([name])
  }

  function handleMechanism(entity, mech, features) {
    entity._status('authenticate')

    if (mech === 'ANONYMOUS') {
      return authenticate(entity, mech, {}, features)
    }

    return entity.delegate(
      'authenticate',
      (username, password) => {
        return authenticate(entity, mech, {username, password}, features)
      },
      mech
    )
  }

  function authenticate(entity, mechname, credentials) {
    const mech = findMechanism(mechname)
    if (!mech) {
      return Promise.reject(new Error('no compatible mechanism'))
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

    entity._status('authenticating')

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
          reject(
            new SASLError(
              element.children[0].name,
              element.getChildText('text') || '',
              element
            )
          )
        } else if (element.name === 'success') {
          resolve()
          entity._status('authenticated')
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

  return {
    use(...args) {
      return SASL.use(...args)
    },
    route() {
      return function({stanza, entity}, next) {
        if (!match(stanza)) return next()
        return gotFeatures(entity, stanza)
          .then(() => {
            return entity.restart()
          })
          .catch(err => {
            entity.emit('error', err)
          })
      }
    },
  }
}
