'use strict'

module.exports = function promise(EE, event) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      EE.removeListener(event, onEvent)
      EE.removeListener('error', onError)
    }
    function onError(reason) {
      reject(reason)
      cleanup()
    }
    function onEvent(value) {
      resolve(value)
      cleanup()
    }
    EE.once('error', onError)
    EE.once(event, onEvent)
  })
}
