#!/usr/bin/env node

'use strict'

const pify = require('pify')
const path = require('path')
const readFile = pify(require('fs').readFile)
const execFile = pify(require('child_process').execFile, {multiArgs: true})

const DATA_PATH = path.join(__dirname)
const PID_PATH = path.join(DATA_PATH, 'prosody.pid')
const DELAY = 2000

function kill (pid) {
  return new Promise((resolve) => {
    try {
      process.kill(pid, 'SIGTERM')
    } catch (e) {} // eslint-disable-line no-empty
    resolve(pid)
  })
}

function delay (value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), DELAY)
  })
}

function getPid () {
  return new Promise((resolve, reject) => {
    readFile(PID_PATH, 'utf8')
    .then(resolve)
    .catch(err => {
      if (err.code === 'ENOENT') resolve('')
      else reject(err)
    })
  })
}

function _start () {
  return execFile('prosody', {
    cwd: DATA_PATH,
    env: {
      'PROSODY_CONFIG': 'prosody.cfg.lua',
    },
  })
  .then(delay)
  .then(() => {
    return getPid().then(pid => {
      if (!pid) return new Error(`Couldn't read prosody.pid.`)
      return pid
    })
  })
}

function start () {
  return getPid().then((pid) => {
    if (pid) return pid
    return _start()
  })
}

function stop () {
  return getPid().then((pid) => {
    if (!pid) return pid
    return kill(pid).then(delay).then(() => {
      return getPid().then(npid => {
        if (npid) return new Error(`Couldn't stop prosody`)
        return pid
      })
    })
  })
}

function restart () {
  return stop().then(() => {
    return _start()
  })
}

module.exports.getPid = getPid
module.exports.start = start
module.exports.stop = stop
module.exports.restart = restart
