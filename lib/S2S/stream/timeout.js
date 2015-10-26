'use strict'

/**
 * Emulates stream.setTimeout() behaviour, but respects outgoing data
 * too.
 *
 * @param {Number} timeout Milliseconds
 */
exports.attach = function (stream, timeout) {
  var timer
  var emitTimeout = function () {
    timer = undefined
    stream.emit('timeout')
  }
  var updateTimer = function () {
    if (timer) clearTimeout(timer)
    timer = setTimeout(emitTimeout, timeout)
  }

  var oldWrite = stream.write
  stream.write = function () {
    updateTimer()
    oldWrite.apply(this, arguments)
  }
  var clear = function () {
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
