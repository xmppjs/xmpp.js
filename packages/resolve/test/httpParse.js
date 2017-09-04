'use strict'

const test = require('ava')

const domain = 'example.com'
global.fetch = url => {
  if (url !== `https://${domain}/.well-known/host-meta`) {
    throw new Error('Fetch URL incorrect')
  }

  return Promise.resolve({
    text() {
      return `<?xml version='1.0' encoding='UTF-8'?>
              <XRD xmlns='http://docs.oasis-open.org/ns/xri/xrd-1.0'>
                <Link rel='urn:xmpp:alt-connections:websocket' href='wss://example.com/ws' />
                <Link rel='urn:xmpp:alt-connections:xbosh' href='http://example.com/bosh' />
                <Link rel='urn:xmpp:alt-connections:httppoll' href='http://example.com/http-poll' />
              </XRD>`
    },
  })
}
const {resolve} = require('../lib/http')

test.cb('parse', t => {
  resolve(domain)
    .then(result => {
      t.deepEqual(result, [
        {
          rel: 'urn:xmpp:alt-connections:websocket',
          href: 'wss://example.com/ws',
          method: 'websocket',
          uri: 'wss://example.com/ws',
        },
        {
          rel: 'urn:xmpp:alt-connections:xbosh',
          href: 'http://example.com/bosh',
          method: 'xbosh',
          uri: 'http://example.com/bosh',
        },
        {
          rel: 'urn:xmpp:alt-connections:httppoll',
          href: 'http://example.com/http-poll',
          method: 'httppoll',
          uri: 'http://example.com/http-poll',
        },
      ])
      t.end()
    })
    .catch(t.end)
})
