'use strict'

/**
 * This is extremely simple and unprecise.
 *
 * @param {Number} rateLimit B/ms or KB/s
 */
exports.attach = function (stream, rateLimit) {
  let timer
  // Makes it readjustable after attachment
  stream.rateLimit = rateLimit
  stream.on('data', (data) => {
    if (timer) clearTimeout(timer)
    stream.pause()
    const sleep = Math.floor(data.length / stream.rateLimit)
    timer = setTimeout(() => {
      timer = undefined
      stream.resume()
    }, sleep)
  })
  stream.on('close', () => {
    // Don't let the last timeout inhibit node shutdown
    if (timer) clearTimeout(timer)
  })
}
