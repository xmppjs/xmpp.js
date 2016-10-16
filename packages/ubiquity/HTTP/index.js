'use strict'

const express = require('express')
const server = express()
const presences = require('../presences')
const path = require('path')

server.get('/:hash/nick', (req, res, next) => {
  const status = presences.get(req.params.hash, 'nick')
  res.send(status || '')
})

server.get('/:hash/status', (req, res, next) => {
  const status = presences.get(req.params.hash, 'status')
  res.send(status || '')
})

server.get('/:hash/show', (req, res, next) => {
  const show = presences.get(req.params.hash, 'show')
  res.send(show || '')
})

server.get('/:hash/avatar', (req, res, next) => {
  const avatar = presences.get(req.params.hash, 'avatar')
  if (!avatar) return res.send(404)
  res.set('content-type', avatar.type)
  res.sendFile(req.params.hash, {
    root: path.join(__dirname, '../avatars/')
  }, (err) => {
    if (err) {
      console.error(err)
      res.status(err.status).end()
    }
  })
})

module.exports.start = function () {
  return new Promise((resolve, reject) => {
    server.listen(4545, err => {
      if (err) return reject(err)
      console.log('HTTP server listening on', 4545)
      resolve()
    })
  })
}
