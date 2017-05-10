'use strict'

const SASLFactory = require('saslmechanisms')
const {encode, decode} = require('./b64')
const xml = require('@xmpp/xml')
const Plugin = require('../../lib/Plugin')
const {XMPPError} = require('@xmpp/connection')

const NS = 'urn:ietf:params:xml:ns:xmpp-sasl'

class SASLError extends XMPPError {}
SASLError.prototype.name = 'SASLError'

function getMechanismNames (features) {
  return features.getChild('mechanisms', NS).children.map(el => el.text())
}

class SASLPlugin extends Plugin {
  constructor (...args) {
    super(...args)
    this.SASL = new SASLFactory()
  }

  use (...args) {
    this.SASL.use(...args)
  }

  gotFeatures (features) {
    const offered = getMechanismNames(features)
    const usable = this.getUsableMechanisms(offered)
    const available = this.getAvailableMechanisms()
    return Promise.resolve(this.getMechanism(offered, usable, available, features)).then((mech) => {
      return Promise.resolve(this.getCredentials()).then(([username, password]) => {
        return this.authenticate(mech, {username, password}, features).then(() => {
          this.entity._authenticated()
        })
      })
    })
  }

  getAvailableMechanisms () {
    return this.SASL._mechs.map(({name}) => name)
  }

  getUsableMechanisms (mechs) {
    const supported = this.getAvailableMechanisms()
    return mechs.filter((mech) => {
      return supported.indexOf(mech) > -1
    })
  }

  getCredentials () {
    return []
  }

  getMechanism (usable) {
    return usable[0] // FIXME prefer SHA-1, ... maybe order usable, available, ... by preferred?
  }

  findMechanism (name) {
    return this.SASL.create([name])
  }

  authenticate (mechname, credentials, features) {
    const mech = this.findMechanism(mechname)
    if (!mech) return Promise.reject(new Error('no compatible mechanism'))

    const {domain} = this.entity.options
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
          this.entity.send(xml`
            <response xmlns='${NS}' mechanism='${mech.name}'>
              ${typeof resp === 'string' ? encode(resp) : ''}
            </response>
          `)
          return
        }

        if (element.name === 'failure') {
          reject(new SASLError(
            element.children[0].name,
            element.getChild('text')
          ))
        } else if (element.name === 'success') {
          resolve()
        }

        this.entity.removeListener('nonza', handler)
      }
      this.entity.on('nonza', handler)

      if (mech.clientFirst) {
        this.entity.send(xml`
          <auth xmlns='${NS}' mechanism='${mech.name}'>
            ${encode(mech.response(creds))}
          </auth>
        `)
      }
    })
  }
}

module.exports = SASLPlugin
