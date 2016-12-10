/*
 * XEP-0078: Non-SASL Authentication
 * https://xmpp.org/extensions/xep-0078.html
 */

import JID from '@xmpp/jid'

const NS = 'http://jabber.org/features/iq-auth'
const NS_AUTH = 'jabber:iq:auth'

function authenticate (client, credentials) {
  const resource = credentials.resource || client.id()

  // In XEP-0078, authentication and binding are parts of the same operation
  const jid = new JID(credentials.username, client.domain, resource)

  const stanza = (
    <iq type='set'>
      <query xmlns={NS_AUTH}>
        <username>{jid.local}</username>
        <password>{credentials.password}</password>
        <resource>{jid.resource}</resource>
      </query>
    </iq>
  )

  return client.request(stanza, {next: true})
    .then(result => {
      client._jid(jid)
      return result
    })
}

function match (features) {
  return features.getChild('auth', NS)
}

function plugin (client) {
  if (client.registerStreamFeature) {
    client.registerStreamFeature(streamFeature)
  }
}

const streamFeature = {
  priority: 0,
  match,
  restart: true,
  run: (client) => {
    const credentials = {
      username: client.options.username,
      password: client.options.password,
      resource: client.options.resource
    }
    return authenticate(client, credentials)
  }
}

export default {NS, NS_AUTH, authenticate, match, plugin, streamFeature}
