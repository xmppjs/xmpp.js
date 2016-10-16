'use strict'

const level = require('level')
const db = level('./db', {
  valueEncoding: 'json'
})
const presences = require('./presences')

module.exports = db
module.exports.start = function () {
  return new Promise((resolve, reject) => {
    const stream = db.createReadStream()
    stream.on('data', ({key, value}) => {
      const hash = presences.hash(key)
      Object.entries(value).forEach(([key, value]) => {
        presences.set(hash, key, value)
      })
      presences.set(hash, 'jid', key)
    })
    stream.on('end', resolve)
    stream.on('error', reject)
  })
}
