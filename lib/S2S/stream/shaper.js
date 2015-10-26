'use strict'

/**
 * This is extremely simple and unprecise.
 *
 * @param {Number} rateLimit B/ms or KB/s
 */
exports.attach = function (stream, rateLimit) {
  var timer
  // makes it readjustable after attachment
  stream.rateLimit = rateLimit
  stream.on('data', function (data) {
    if (timer) clearTimeout(timer)
    stream.pause()
    var sleep = Math.floor(data.length / stream.rateLimit)
    timer = setTimeout(function () {
      timer = undefined
      stream.resume()
    }, sleep)
  })
  stream.on('close', function () {
    // don't let the last timeout inhibit node shutdown
    if (timer) clearTimeout(timer)
  })
}
