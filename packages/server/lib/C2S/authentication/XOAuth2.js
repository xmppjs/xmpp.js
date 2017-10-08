'use strict'

const Mechanism = require('./Mechanism')

/**
 * @see https://developers.google.com/talk/jep_extensions/oauth
 */
class XOAuth2 extends Mechanism {
  extractSasl(auth) {
    const params = auth.split('\x00')
    const authRequest = {
      'jid': params[1],
      'oauth_token': params[2],
    }
    return authRequest
  }
}

XOAuth2.prototype.name = 'X-OAUTH2'
XOAuth2.id = 'X-OAUTH2'

module.exports = XOAuth2
