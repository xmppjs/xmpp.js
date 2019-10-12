'use strict'

/* eslint no-console: 0 */

const serialize = require('@xmpp/xml/lib/serialize')
const parse = require('@xmpp/xml/lib/parse')
const xml = require('@xmpp/xml')

const NS_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

const SENSITIVES = [
  ['handshake', 'jabber:component:accept'],
  ['auth', NS_SASL],
  ['challenge', NS_SASL],
  ['response', NS_SASL],
  ['success', NS_SASL],
]

function isSensitive(element) {
  if (element.children.length === 0) return false
  return SENSITIVES.some(sensitive => {
    return element.is(...sensitive)
  })
}

function hideSensitive(element) {
  if (isSensitive(element)) {
    element.children = []
    element.append(xml('hidden', {xmlns: 'xmpp.js'}))
  }

  return element
}

function format(data, root) {
  let str
  try {
    const element = parse(data)
    element.parent = root
    str = serialize(hideSensitive(element), 2, 2)
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    str = ' ' + data
  }

  return str
}

module.exports = function debug(entity, force) {
  if (process.env.XMPP_DEBUG || force === true) {
    entity.on('input', data => {
      console.debug('⮈', format(data, entity.parser.root))
    })

    entity.on('output', data => {
      console.debug('⮊', format(data, entity.root))
    })

    entity.on('error', err => console.error('❌', err))

    entity.on('status', (status, value) => {
      if (['online', 'offline'].includes(status)) {
        console.log('🛈', status, value ? value.toString() : '')
      } else {
        console.debug('🛈', status, value ? value.toString() : '')
      }
    })
  }
}
