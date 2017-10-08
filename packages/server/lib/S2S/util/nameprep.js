'use strict'

let nameprep
try {
  const { StringPrep } = require('node-stringprep') // eslint-disable-line node/no-missing-require
  const c = n => {
    const p = new StringPrep(n)
    return s => p.prepare(s)
  }
  nameprep = c('nameprep')
} catch (err) {
  nameprep = a => a
}

module.exports = nameprep
