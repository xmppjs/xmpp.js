'use strict'

const {encode, decode} = require('./lib/b64')
const plugin = require('@xmpp/plugin')
const xml = require('@xmpp/xml')
const streamFeatures = require('../stream-features')
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

module.exports = plugin(
  'sasl',
  {
    start() {
      this.SASL = new SASLFactory()
      this.streamFeature = {
        name: 'sasl',
        priority: 1000,
        match,
        restart: true,
        run: (entity, features) => {
          return this.gotFeatures(features)
        },
      }
      this.plugins['stream-features'].add(this.streamFeature)
    },

    stop() {
      delete this.SASL
      this.plugins['stream-features'].remove(this.streamFeature)
      delete this.streamFeature
      delete this.mech
    },

    use(...args) {
      this.SASL.use(...args)
    },

    gotFeatures(features) {
      const offered = getMechanismNames(features)
      const usable = this.getUsableMechanisms(offered)
      // FIXME const available = this.getAvailableMechanisms()

      return Promise.resolve(this.getMechanism(usable)).then(mech => {
        this.mech = mech
        return this.handleMechanism(mech, features)
      })
    },

    handleMechanism(mech, features) {
      this.entity._status('authenticate')

      if (mech === 'ANONYMOUS') {
        return this.authenticate(mech, {}, features)
      }

      return this.entity.delegate(
        'authenticate',
        (username, password) => {
          return this.authenticate(mech, {username, password}, features)
        },
        mech
      )
    },

    getAvailableMechanisms() {
      return this.SASL._mechs.map(({name}) => name)
    },

    getUsableMechanisms(mechs) {
      const supported = this.getAvailableMechanisms()
      return mechs.filter(mech => {
        return supported.indexOf(mech) > -1
      })
    },

    getMechanism(usable) {
      return usable[0] // FIXME prefer SHA-1, ... maybe order usable, available, ... by preferred?
    },

    findMechanism(name) {
      return this.SASL.create([name])
    },

    authenticate(mechname, credentials) {
      const mech = this.findMechanism(mechname)
      if (!mech) {
        return Promise.reject(new Error('no compatible mechanism'))
      }

      const {domain} = this.entity.options
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

      this.entity._status('authenticating')

      return new Promise((resolve, reject) => {
        const handler = element => {
          if (element.attrs.xmlns !== NS) {
            return
          }

          if (element.name === 'challenge') {
            mech.challenge(decode(element.text()))
            const resp = mech.response(creds)
            this.entity.send(
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
            this.entity._status('authenticated')
          }

          this.entity.removeListener('nonza', handler)
        }
        this.entity.on('nonza', handler)

        if (mech.clientFirst) {
          this.entity.send(
            xml(
              'auth',
              {xmlns: NS, mechanism: mech.name},
              encode(mech.response(creds))
            )
          )
        }
      })
    },
  },
  [streamFeatures]
)
