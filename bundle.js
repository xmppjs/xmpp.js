#!/usr/bin/env node

import fs from "fs"
import path from "path"
import browserify from "browserify"
import commonShake from "common-shakeify"
import packFlat from "browser-pack-flat"
import exorcist from "exorcist"
import { minify } from "uglify-js"

const __dirname = import.meta.dirname;

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
