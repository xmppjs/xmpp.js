'use strict'

module.exports = function debug(entity) {
  if (process.env.XMPP_DEBUG) {
    entity.on('input', data => console.log('⮈ IN ', data))
    entity.on('output', data => console.log('⮊ OUT', data))
    ;['connect', 'open', 'authenticated', 'online', 'error', 'authenticate'].forEach(event => {
      entity.on(event, arg => {
        if (arg === undefined || arg === null || typeof arg === 'function') {
          console.log('🛈    ', event)
        } else {
          console.log('🛈    ', event, arg.toString())
        }
      })
    })
  }
}
