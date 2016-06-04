/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#bind
 */

// FIXME let's not use client-iq-caller here
// bind is not really an iq
import {request} from '@xmpp/client-iq-caller'

const NS = 'urn:ietf:params:xml:ns:xmpp-bind'

function stanza (resource) {
  return (
    <iq type='set'>
      <bind xmlns={NS}>{
      resource
      ? <resource>{resource}</resource>
      : null
      }
      </bind>
    </iq>
  )
}

function match (features) {
  return features.getChild('bind', NS)
}

function bind (client, resource) {
  return request(client, stanza(resource), {next: true})
    .then(result => {
      return client._jid(result.getChild('jid').text())
    })
}

function plugin (client) {
  // FIXME require plugin instead ?
  if (client.registerStreamFeature) {
    client.registerStreamFeature(streamFeature)
  }
}

const streamFeature = {
  priority: 2500,
  match: match,
  run: (client) => {
    return bind(client, client.options.resource)
  }
}

export default plugin
export {NS, stanza, match, bind, plugin, streamFeature}
