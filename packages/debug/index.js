'use strict'

module.exports = function debug(entity) {
  if (process.env.XMPP_DEBUG) {
    entity.on('input', data => console.log('⮈ IN ', data))
    entity.on('output', data => console.log('⮊ OUT', data))
    entity.on('status', (status, value) => {
      if (value === undefined || value === null || typeof value === 'function') {
        console.log('🛈    ', status)
      } else {
        console.log('🛈    ', status, value.toString())
      }
    })
  }
}
