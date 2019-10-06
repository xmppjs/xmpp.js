'use strict'

module.exports = function id() {
  let i
  while (!i) {
    i = Math.random()
      .toString(36)
      .slice(2, 12)
  }

  return i
}
