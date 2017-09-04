#!/usr/bin/env node

'use strict' // eslint-disable-line node/shebang

const express = require('express')
const opn = require('opn')
const path = require('path')

module.exports = function(flags, endpoint) {
  const port = flags.port || 8080

  const app = express()

  app.use(express.static(path.join(__dirname, 'public')))
  app.get('/params', (req, res, next) => {
    res.json({endpoint}, next)
  })
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) {
      return res.sendFile('index.html', {root: 'public'}, next)
    }
    return next()
  })

  app.listen(port, () => {
    const url = `http://localhost:${port}`

    if (!('open' in flags)) {
      opn(url)
    }
    process.stdout.write(url)
  })
}
