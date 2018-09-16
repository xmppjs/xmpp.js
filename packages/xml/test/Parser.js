'use strict'

const test = require('ava')
const Parser = require('../lib/Parser')

test.cb('stream parser', t => {
  const parser = new Parser()

  t.plan(4)

  parser.on('start', el => {
    t.is(el.toString(), '<foo/>')
  })

  parser.on('element', el => {
    t.is(el.parent, null)
    t.is(el.toString(), '<bar>hello</bar>')
  })

  parser.on('end', el => {
    t.is(el.toString(), '<foo/>')
    t.end()
  })

  parser.write('<foo><bar>hello</bar></foo>')
})
