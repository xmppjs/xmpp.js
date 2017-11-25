'use strict'

const test = require('ava')
const xmpp = require('.')

const fs = require('fs')
const path = require('path')

test('exports packages', t => {
  const packages = fs
    .readdirSync(path.join(__dirname, '..'))
    // For some reason there's a * file on travis
    .filter(p => !['console', 'plugins', '*'].includes(p) && !p.includes('.'))

  t.is(Object.keys(xmpp).length, packages.length)

  packages.forEach(pkg => {
    t.is(xmpp[pkg], require(path.join(__dirname, '..', pkg)))
  })
})
