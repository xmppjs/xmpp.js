'use strict'

module.exports.name = 'reconnect'
module.exports.plugin = function plugin (entity) {
  let delay = 1000

  function reconnect () {
    entity.emit('reconnecting')
    entity.start(entity.startOptions)
      .then(() => {
        entity.emit('reconnected')
      })
      .catch((err) => {
        entity.emit('error', err)
        setTimeout(() => {
          reconnect()
        }, delay)
      })
  }

  entity.on('close', () => {
    setTimeout(() => {
      reconnect()
    }, delay)
  })

  return {
    entity,
    setDelay (d) {
      delay = d
    },
    getDelay () {
      return delay
    }
  }
}
