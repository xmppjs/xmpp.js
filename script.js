'use strict'

// Makes xmpp.js package exports all other packages

const fs = require('fs')
const path = require('path')

/*
 * For packages/plugins/
 */

// Write packages/plugins/index.js

// const plugins = fs
//   .readdirSync(path.join(__dirname, 'packages/plugins'))
//   .filter(p => !['node_modules'].includes(p) && !p.includes('.'))

// fs.writeFileSync(
//   path.join(__dirname, 'packages/plugins/index.js'),
//   plugins.reduce((s, name) => {
//     s += `module.exports['${name}'] = require('@xmpp/plugins/${name}')\n`
//     return s
//   }, `'use strict'\n\n`)
// )

/*
 * For packages/xmpp.js/
 */

const packages = fs
  .readdirSync(path.join(__dirname, 'packages'))
  .filter(
    p => !['console', 'xmpp.js', 'plugins'].includes(p) && !p.startsWith('.')
  )

const pkg = require(path.join(__dirname, 'packages/xmpp.js/package.json'))

// Write packages/xmpp.js/package.json dependencies
pkg.dependencies = packages.reduce((dict, name) => {
  dict[`@xmpp/${name}`] = `^${pkg.version}`
  return dict
}, {})
fs.writeFileSync(
  path.join(__dirname, 'packages/xmpp.js/package.json'),
  JSON.stringify(pkg, null, 2)
)

// Write packages/xmpp.js/index.js
fs.writeFileSync(
  path.join(__dirname, 'packages/xmpp.js/index.js'),
  packages.reduce((s, name) => {
    s += `module.exports['${name}'] = require('@xmpp/${name}')\n`
    return s
  }, `'use strict'\n\n`)
)
