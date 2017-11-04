'use strict'

/**
 * Each implemented mechanism offers multiple methods
 * - name : name of the auth method
 * - auth :
 * - match: checks if the client has enough options to
 *          offer this mechanis to xmpp servers
 * - authServer: takes a stanza and extracts the information
 */

const { EventEmitter } = require('@xmpp/events')

// Mechanisms
class Mechanism extends EventEmitter {
  // The following functions will be overridden by xmpp server
  /**
   * Handle failures within the mechanism
   * @param {String} error
   */
  success() { }

  /**
   * Handle failures within the mechanism
   * @param {String} error
   */
  failure() { }

  authenticate() { }

  manageAuth(stanza) {
    const self = this

    const auth = Buffer.from(stanza.getText(), 'base64').toString('utf8')
    this.authenticate(this.extractSasl(auth), (err, user) => {
      if (!err && user) {
        self.success(user)
      } else {
        self.failure(err)
      }
    })
  }

  // This method should be overriden in custom mechanisms
  extractSasl() {
    throw new Error('This is an abstract method, you should override it')
  }
}

module.exports = Mechanism
