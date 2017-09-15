'use strict'

const fs = require('fs')
const path = require('path')

const packages = fs
  .readdirSync(path.join(__dirname, '..'))
  .filter(p => p !== 'xmpp.js')

const pkg = require(path.join(__dirname, 'package.json'))

// Write package.json
pkg.dependencies = packages.reduce((dict, name) => {
  dict[`@xmpp/${name}`] = `^${pkg.version}`
  return dict
}, {})
fs.writeFileSync(
  path.join(__dirname, 'package.json'),
  JSON.stringify(pkg, null, 2)
)

// Write index.js
fs.writeFileSync(
  path.join(__dirname, 'index.js'),
  packages.reduce((s, name) => {
    s += `module.exports['${name}'] = require('@xmpp/${name}')\n`
    return s
  }, `'use strict'\n\n`)
)
