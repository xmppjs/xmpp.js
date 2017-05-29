'use strict'

module.exports.name = 'reconnect'
module.exports.plugin = function plugin(entity) {
  let delay = 1000

  function reconnect() {
    entity.emit('reconnecting')
    entity.connect(entity.connectOptions).then(() => {
      return entity.open(entity.openOptions)
    }).then(() => {
      entity.emit('reconnected')
    })
      .catch(err => {
        entity.emit('error', err)
        setTimeout(() => {
          reconnect()
        }, delay)
      })
  }

  function online() {
    entity.on('close', () => {
      setTimeout(() => {
        reconnect()
      }, delay)
    })
  }

  if (entity.jid) {
    online()
  } else {
    entity.once('online', online)
  }

  return {
    entity,
    setDelay(d) {
      delay = d
    },
    getDelay() {
      return delay
    },
  }
}
