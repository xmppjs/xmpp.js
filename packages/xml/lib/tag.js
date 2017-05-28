'use strict'

const LtxParser = require('ltx/lib/parsers/ltx')
const createStanza = require('./createStanza')
const escape = require('ltx').escapeXML

function tag (literals, ...substitutions) {
  const parser = new LtxParser()

  let el
  let tree
  let i
  parser.on('startElement', function (name, attrs) {
    const child = createStanza(name, attrs)
    if (!el) {
      el = child
    } else {
      el = el.cnode(child)
    }
  })
  parser.on('endElement', function (name) {
    if (name === el.name) {
      if (el.parent) {
        el = el.parent
      } else if (!tree) {
        tree = el
        el = undefined
      }
    }
  })
  parser.on('text', str => {
    if (!el) return

    if (substitutions[i - 1] === str) {
      el.t(str)
    } else {
      str = str.trim()
      if (str) el.t(str)
    }
  })

  for (i = 0; i < substitutions.length; i++) {
    parser.write(literals[i])
    parser.write(escape(substitutions[i]))
  }
  parser.end(literals[literals.length - 1])

  return tree
}

module.exports = tag
