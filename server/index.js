#!/usr/bin/env node

'use strict' // eslint-disable-line node/shebang

const promisify = require('util.promisify')
const path = require('path')
const readFile = promisify(require('fs').readFile)
const execFile = promisify(require('child_process').execFile)
const removeFile = promisify(require('fs').unlink)
const net = require('net')
const {promise, delay} = require('../packages/events')

const DATA_PATH = path.join(__dirname)
const PID_PATH = path.join(DATA_PATH, 'prosody.pid')

function clean() {
  return Promise.all(
    ['prosody.err', 'prosody.log', 'prosody.pid'].map(file =>
      removeFile(path.join(__dirname, file))
    )
  ).catch(() => {})
}

function isPortOpen() {
  const sock = new net.Socket()
  sock.connect({port: 5347})
  return promise(sock, 'connect')
    .then(() => {
      sock.end()
      sock.destroy()
      return true
    })
    .catch(() => false)
}

function waitPortOpen() {
  return isPortOpen().then(open => {
    if (open) {
      return Promise.resolve()
    }
    return delay(1000).then(() => waitPortOpen())
  })
}

function waitPortClose() {
  return isPortOpen().then(open => {
    if (open) {
      return delay(1000).then(() => waitPortClose())
    }
    return Promise.resolve()
  })
}

function kill(pid) {
  return new Promise(resolve => {
    process.kill(pid, 'SIGKILL')
    resolve()
  })
}

function getPid() {
  return new Promise((resolve, reject) => {
    readFile(PID_PATH, 'utf8')
      .then(resolve)
      .catch(err => {
        if (err.code === 'ENOENT') {
          resolve('')
        } else {
          reject(err)
        }
      })
  })
}

function _start() {
  return Promise.all([
    execFile('prosody', {
      cwd: DATA_PATH,
      env: {
        PROSODY_CONFIG: 'prosody.cfg.lua',
      },
    }),
    waitPortOpen(),
  ])
}

function start() {
  return isPortOpen().then(open => {
    if (open) {
      return Promise.resolve()
    }
    return clean().then(() => _start())
  })
}

function stop() {
  return isPortOpen().then(open => {
    if (!open) {
      return clean()
    }
    return Promise.all([
      getPid().then(pid => (pid ? kill(pid) : undefined)),
      waitPortClose(),
    ]).then(() => clean())
  })
}

function restart() {
  return stop().then(() => {
    return _start()
  })
}

exports.isPortOpen = isPortOpen
exports.waitPortClose = waitPortClose
exports.waitPortOpen = waitPortOpen
exports.getPid = getPid
exports.start = start
exports.stop = stop
exports.restart = restart
