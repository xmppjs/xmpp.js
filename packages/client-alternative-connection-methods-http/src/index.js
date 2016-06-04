/*
 * References
 * XEP-0156: Discovering Alternative XMPP Connection Methods
 *   https://xmpp.org/extensions/xep-0156.html
 * RFC 6415: Web Host Metadata
 *   https://tools.ietf.org/html/rfc6415
 *
 * https://github.com/xsf/xeps/pull/198
 */

import {parse as parseXML} from '@xmpp/xml'
import http from '@xmpp/client-http'

export const NS_XRD = 'http://docs.oasis-open.org/ns/xri/xrd-1.0'
export const REL_BOSH = 'urn:xmpp:alt-connections:xbosh'
export const REL_WS = 'urn:xmpp:alt-connections:websocket'
export const HOST_META = '/.well-known/host-meta'

export function parse (doc) {
  if (typeof doc === 'string') doc = parseXML(doc)
  if (!doc.is('XRD', NS_XRD)) throw new Error('invalid XRD document')
}

export function read (doc) {
  const bosh = []
  const websocket = []

  doc.getChildren('Link').forEach(link => {
    const {rel, href} = link.attrs
    if (rel === REL_BOSH) bosh.push(href)
    else if (rel === REL_WS) websocket.push(href)
  })

  return {bosh, websocket}
}

export function getAltnernativeConnectionsMethods (domain, secure) {
  return http(`http${secure ? 's' : ''}://${domain}${HOST_META}`, {
    headers: {
      accept: 'application/xrd+xml'
    }
  })
  .then(response => response.text())
  .then(parse)
  .then(read)
}
