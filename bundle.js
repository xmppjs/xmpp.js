#!/usr/bin/env node

/* eslint-disable no-console */

'use strict' // eslint-disable-line node/shebang

const fs = require('fs')
const path = require('path')
const browserify = require('browserify')
const commonShake = require('common-shakeify')
const packFlat = require('browser-pack-flat')
const exorcist = require('exorcist')
const {minify} = require('uglify-js')

const dist = path.join(__dirname, 'packages/client/dist')

browserify(path.join(__dirname, 'packages/client/'), {debug: true, standalone: 'XMPP'})
  .transform('babelify', {global: true})
  .plugin(commonShake)
  .plugin(packFlat)
  // .on('dep', dep => {
  //   console.log(dep.file)
  // })
  .bundle()
  .pipe(exorcist(path.join(dist, 'xmpp.js.map')))
  .pipe(fs.createWriteStream(path.join(dist, 'xmpp.js')))
  .on('finish', () => {
    const bundled = fs.readFileSync(path.join(dist, 'xmpp.js')).toString()
    const sourceMap = fs.readFileSync(path.join(dist, 'xmpp.js.map')).toString()
    const {code, map, error} = minify(bundled, {
      sourceMap: {
        content: sourceMap,
        url: 'xmpp.min.js.map',
        filename: 'xmpp.min.js',
      },
    })
    if (error) return console.error(error)
    fs.writeFileSync(path.join(dist, 'xmpp.min.js'), code)
    fs.writeFileSync(path.join(dist, 'xmpp.min.js.map'), map)
  })
