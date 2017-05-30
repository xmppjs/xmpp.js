'use strict'

const Parser = require('./Parser')
const {escapeXML} = require('ltx/lib/escape')

function error(literals, substitutions) {
  let s = ''
  for (let i = 0; i < substitutions.length; i++) {
    s += literals[i]
    s += escapeXML(substitutions[i])
  }
  s += literals[literals.length - 1]
  return new Parser.XMLError(s)
}

function tag(literals, ...substitutions) {
  const parser = new Parser(literals, ...substitutions)

  let i
  let tree

  parser.on('error', () => {
    error(literals, substitutions)
  })

  parser.onText = (str, element) => {
    if (substitutions[i - 1] === str) {
      element.t(str)
    } else {
      str = str.trim()
      if (str) {
        element.t(str)
      }
    }
  }

  parser.on('endElement', (el, root) => {
    if (root) {
      tree = el
    }
  })

  for (i = 0; i < substitutions.length; i++) {
    parser.write(literals[i])
    parser.write(escapeXML(substitutions[i]))
  }
  parser.end(literals[literals.length - 1])

  return tree
}

module.exports = tag
