'use strict'

module.exports = function promise(EE, event, rejectEvent = 'error') {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      EE.removeListener(event, onEvent)
      EE.removeListener(rejectEvent, onError)
    }
    function onError(reason) {
      reject(reason)
      cleanup()
    }
    function onEvent(value) {
      resolve(value)
      cleanup()
    }
    EE.once(event, onEvent)
    if (rejectEvent) {
      EE.once(rejectEvent, onError)
    }
  })
}
