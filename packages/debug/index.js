'use strict'

module.exports = function debug(entity, force, prefix = '') {
  if (process.env.XMPP_DEBUG || force === true) {
    entity.on('input', data => console.log(prefix + '⮈', data))
    entity.on('output', data => console.log(prefix + '⮊', data))
    entity.on('error', err => console.error(prefix + '❌', err))
    entity.on('status', (status, value) =>
      console.log(prefix + '🛈', status, value ? value.toString() : '')
    )
  }
}
