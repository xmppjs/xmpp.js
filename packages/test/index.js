'use strict'

const context = require('./context')
const xml = require('@xmpp/xml')
const jid = require('@xmpp/jid')
const mockClient = require('./mockClient')
const {delay, promise, timeout} = require('@xmpp/events')

module.exports.context = context
module.exports.xml = xml
module.exports.jid = jid
module.exports.JID = jid
module.exports.mockClient = mockClient
module.exports.delay = delay
module.exports.promise = promise
module.exports.timeout = timeout
module.exports.mockInput = (entity, el) => {
  entity.emit('input', el.toString())
  entity._onElement(el)
}

module.exports.promiseSend = async entity => {
  const stanza = await promise(entity, 'send', '')
  delete stanza.attrs.xmlns
  return stanza
}

module.exports.promiseError = entity => {
  return promise(entity, 'error', '')
}
