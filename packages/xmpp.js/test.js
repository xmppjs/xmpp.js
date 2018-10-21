'use strict'

const test = require('ava')

const fs = require('fs')
const path = require('path')

const packages = fs
  .readdirSync(path.join(__dirname, '..'))
  // For some reason there's a "*" file on travis
  .filter(p => !['*'].includes(p) && !p.includes('.'))
  .map(name => require(path.join(__dirname, '..', name, 'package.json')))
  .reduce((dict, pkg) => {
    dict[pkg.name] = `^${pkg.version}`
    return dict
  }, {})

const {dependencies} = require('./package.json')

test('depends on all other packages', t => {
  t.is(Object.keys(dependencies).length, Object.keys(packages).length)
  t.deepEqual(dependencies, packages)
})
