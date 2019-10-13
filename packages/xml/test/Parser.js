'use strict'

const test = require('ava')
const Parser = require('../lib/Parser')

test.cb('stream parser', t => {
  const parser = new Parser()

  t.plan(5)

  let startElement

  parser.on('start', el => {
    t.is(el.toString(), '<foo/>')
    startElement = el
  })

  parser.on('element', el => {
    t.is(el.parent, startElement)
    t.is(startElement.children.length, 0)
    t.is(el.toString(), '<bar>hello</bar>')
  })

  parser.on('end', el => {
    t.is(el.toString(), '<foo/>')
    t.end()
  })

  parser.write('<foo><bar>hello</bar></foo>')
})
