'use strict'

const Parser = require('./Parser')

module.exports = function parse(data) {
  const p = new Parser()

  let result = null
  let error = null

  p.on('start', el => {
    result = el
  })
  p.on('element', el => {
    result.append(el)
  })
  p.on('error', err => {
    error = err
  })

  p.write(data)
  p.end()

  if (error) {
    throw error
  } else {
    return result
  }
}
