'use strict'

/**
 * Each implemented mechanism offers multiple methods
 * - name : name of the auth method
 * - auth :
 * - match: checks if the client has enough options to
 *          offer this mechanis to xmpp servers
 * - authServer: takes a stanza and extracts the information
 */

var util = require('util')
var EventEmitter = require('events').EventEmitter

// Mechanisms
function Mechanism () {}

util.inherits(Mechanism, EventEmitter)

// The following functions will be overridden by xmpp server
Mechanism.prototype = {
  /**
   * handle failures within the mechanism
   * @param {String} error
   */
  success: function () {},

  /**
   * handle failures within the mechanism
   * @param {String} error
   */
  failure: function () {},

  authenticate: function () {},

  manageAuth: function (stanza) {
    var self = this

    var auth = new Buffer(stanza.getText(), 'base64').toString('utf8')
    this.authenticate(this.extractSasl(auth), function (err, user) {
      if (!err && user) {
        self.success(user)
      } else {
        self.failure(err)
      }
    })
  }
}

// This method should be overrriden in custom mechanisms
Mechanism.prototype.extractSasl = function () {
  throw new Error('This is an abstract method, you should overrride it')
}

module.exports = Mechanism
