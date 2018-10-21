'use strict'

// Makes xmpp.js package require and exports all other packages

const fs = require('fs')
const path = require('path')

const packages = fs
  .readdirSync(path.join(__dirname, '..'))
  // For some reason there's a * file on travis
  .filter(p => !['*'].includes(p) && !p.includes('.'))
  .map(name => require(path.join(__dirname, '..', name, 'package.json')))

const xmppjsPackage = require(path.join(__dirname, 'package.json'))

// Write package.json dependencies
xmppjsPackage.dependencies = packages.reduce((dict, pkg) => {
  dict[pkg.name] = `^${pkg.version}`
  return dict
}, {})
fs.writeFileSync(
  path.join(__dirname, 'package.json'),
  JSON.stringify(xmppjsPackage, null, 2) + '\n'
)
