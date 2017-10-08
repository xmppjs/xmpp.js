'use strict'

let nameprep
try {
  const StringPrep = require('node-stringprep').StringPrep
  const c = n => {
    const p = new StringPrep(n)
    return s => p.prepare(s)
  }
  nameprep = c('nameprep')
} catch (ex) {
  nameprep = a => a
}

module.exports = nameprep
