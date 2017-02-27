#!/usr/bin/env node

'use strict'

const express = require('express')
const opn = require('opn')

module.exports = function (flags, params) {
  const port = flags.port || 8080

  const app = express()

  app.use(express.static('public'))
  app.get('/params', (req, res, next) => {
    res.json(params)
  })
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) {
      return res.sendFile('index.html', {root: 'public'}, next)
    } else {
      return next()
    }
  })

  app.listen(port, () => {
    const url = `http://localhost:${port}`

    if (!('open' in flags)) opn(url)
    process.stdout.write(url)
  })
}
