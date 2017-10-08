'use strict'

let nameprep
try {
  const StringPrep = require('node-stringprep').StringPrep
  const c = function (n) {
    const p = new StringPrep(n)
    return function (s) {
      return p.prepare(s)
    }
  }
  nameprep = c('nameprep')
} catch (ex) {
  nameprep = function (a) {
    return a
  }
}

module.exports = nameprep
