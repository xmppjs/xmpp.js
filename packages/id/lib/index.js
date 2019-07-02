'use strict'

module.exports = function id() {
  let i
  while (!i) {
    i = Math.random()
      .toString(36)
      .substr(2, 12)
  }

  return i
}
