'use strict'

/**
 * Emulates stream.setTimeout() behaviour, but respects outgoing data
 * too.
 *
 * @param {Number} timeout Milliseconds
 */
exports.attach = function (stream, timeout) {
  let timer
  const emitTimeout = () => {
    timer = undefined
    stream.emit('timeout')
  }
  const updateTimer = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(emitTimeout, timeout)
  }

  const oldWrite = stream.write
  stream.write = function () {
    updateTimer()
    oldWrite.apply(this, arguments)
  }
  const clear = () => {
    if (timer) clearTimeout(timer)
    if (stream.write !== oldWrite) stream.write = oldWrite
    delete stream.clearTimer
  }
  stream.clearTimer = clear
  stream.on('data', updateTimer)
  stream.on('error', clear)
  stream.on('close', clear)
  stream.on('end', clear)
}
