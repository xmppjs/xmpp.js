'use strict'

/**
 * Emulates stream.setTimeout() behaviour, but respects outgoing data
 * too.
 *
 * @param {Number} timeout Milliseconds
 */
exports.attach = function (stream, timeout) {
  let timer
  const emitTimeout = function () {
    timer = undefined
    stream.emit('timeout')
  }
  const updateTimer = function () {
    if (timer) clearTimeout(timer)
    timer = setTimeout(emitTimeout, timeout)
  }

  const oldWrite = stream.write
  stream.write = function () {
    updateTimer()
    oldWrite.apply(this, arguments)
  }
  const clear = function () {
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
