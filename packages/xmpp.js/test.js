'use strict'

const test = require('ava')

const fs = require('fs')
const path = require('path')

const packages = fs
  .readdirSync(path.join(__dirname, '..'))
  // For some reason there's a "*" file on travis
  .filter(p => !['*'].includes(p) && !p.includes('.'))

const dependencies = Object.keys(require('./package.json').dependencies).map(
  dep => dep.split('@xmpp/')[1]
)

test('depends on all other packages', t => {
  t.is(Object.keys(dependencies).length, packages.length)
  t.deepEqual(dependencies, packages)
})
