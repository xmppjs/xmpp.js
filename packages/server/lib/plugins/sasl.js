'use strict'

const { Element } = require('ltx')
const plugin = require('@xmpp/plugin')
const jid = require('@xmpp/jid')
const streamFeatures = require('./stream-features')

const NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

function onAuth(stanza) {
  // If we haven't already decided for one method
  if (!this.mechanism) {
    const Mechanism = this.findMechanism(stanza.attrs.mechanism)

    // TODO: handle case where we are not able to match a sasl mechanism
    this.mechanism = new Mechanism()

    /**
     * Authenticates a user
     * @param  Object authRequest object with credentials like {user: 'bob', password: 'secret'}
     */
    this.mechanism.authenticate = (user, cb) => {
      if (!user.saslmech) {
        // Attach sasl mechanism
        user.saslmech = this.mechanism.name
      }

      if (user.jid) {
        user.jid = jid(user.jid)
      } else {
        user.jid = jid(user.username, this.domain)
      }
      user.client = this

      // Emit event
      this.emit('authenticate', user, cb)
    }
    this.mechanism.success = (user) => {
      this._status('authenticated')
      this.emit('auth-success', user.jid)
      this.jid = user.jid
      this.authenticated = true
      this.send(new Element('success', { xmlns: NS_XMPP_SASL }))
        .then(() => this.restart())
        .catch(err => this.emit('error', err))
    }
    this.mechanism.failure = (error) => {
      sendAuthError.call(this, error)
    }
  }

  if (this.mechanism) {
    this._status('authenticating')
    this.mechanism.manageAuth(stanza, this)
  }
}

function sendAuthError(error) {
  if (this.jid) {
    this.emit('auth-failure', this.jid)
  }
  const message = error && error.message ? error.message : 'Authentication failure'
  const type = error && error.type ? error.type : 'not-authorized'
  this.send(
    new Element('failure', {
      xmlns: NS_XMPP_SASL,
    })
      .c(type).up()
      .c('text').t(message)
      .root()
  )
}

module.exports = plugin(
  'sasl',
  {
    start() {
      this.streamFeature = {
        name: 'mechanisms',
        xmlns: NS_XMPP_SASL,
        match: (entity) => !entity.authenticated,
        cb: (feature) => {
          this.getAvailableMechanisms()
            .forEach(name => {
              feature.c('mechanism').t(name)
            })
        },
      }
      this.plugins['stream-features'].add(this.streamFeature)

      this._onNonza = onAuth.bind(this.entity)
      this.entity.on('nonza', this._onNonza)

      this.availableSaslMechanisms = []
      this.entity.server.registerSaslMechanism = this.use.bind(this)
      this.entity.server.unregisterSaslMechanism = this.unuse.bind(this)
      this.entity.server.clearSaslMechanisms = () => {
        this.availableSaslMechanisms = []
      }
      this.entity.findMechanism = this.findMechanism.bind(this)
    },

    stop() {
      delete this.availableSaslMechanisms
      this.plugins['stream-features'].remove(this.streamFeature)
      delete this.streamFeature
      this.entity.removeListener('nonza', this._onNonza)
      delete this._onNonza
    },

    use(mech) {
      if (typeof mech === 'function' &&
        this.availableSaslMechanisms.indexOf(mech) === -1) {
        this.availableSaslMechanisms.push(mech)
      }
    },

    unuse(mech) {
      const index = this.availableSaslMechanisms.indexOf(mech)
      if (index >= 0) {
        this.availableSaslMechanisms.splice(index, 1)
      }
    },

    getAvailableMechanisms() {
      return this.availableSaslMechanisms.map(({ id }) => id)
    },

    findMechanism(id) {
      return this.availableSaslMechanisms.find(m => m.id === id)
    },

  },
  [streamFeatures]
)
