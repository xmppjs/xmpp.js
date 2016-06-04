/*
 *  Here Lies Extensible Messaging and Presence Protocol (XMPP) Session
                             Establishment
                     draft-cridland-xmpp-session-01
 *  https://tools.ietf.org/html/draft-cridland-xmpp-session-01
 */

import {request} from '@xmpp/client-iq-caller'

const NS = 'urn:ietf:params:xml:ns:xmpp-session'

function match (features) {
  return features.getChild('session', NS)
}

function isOptional (el) {
  return el.getChild('optional')
}

function establishSession (client) {
  const stanza = (
    <iq type='set'>
      <session xmlns={NS}/>
    </iq>
  )
  return request(client, stanza, {next: true})
}

function plugin (client) {
  console.log('foo')
  if (client.registerStreamFeature) {
    client.registerStreamFeature(streamFeature)
  }
}

const streamFeature = {
  priority: 2250,
  match,
  run: (client) => {
    // FIXME only do if optional ?
    return establishSession(client)
  }
}

export default {NS, establishSession, isOptional, match, plugin, streamFeature}
