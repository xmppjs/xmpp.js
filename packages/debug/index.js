'use strict'

module.exports = function debug (entity) {
  if (process.env.NODE_XMPP_DEBUG) {
    entity.on('fragment', (input, output) => {
      if (input) console.log('⮈ IN ', input.toString())
      if (output) console.log('⮊ OUT', output.toString())
    })
    ;['connect', 'open', 'authenticated', 'online', 'error', 'authenticate'].forEach((event) => {
      entity.on(event, (...args) => {
        args = args.map((a) => a.toString())
        console.log('🛈    ', event, ...args)
      })
    })
  }
}
