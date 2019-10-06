'use strict'

const {promisify} = require('util')
const path = require('path')
const readFile = promisify(require('fs').readFile)
const exec = promisify(require('child_process').exec)
const removeFile = promisify(require('fs').unlink)
const net = require('net')
const {promise, delay} = require('../packages/events')

const DATA_PATH = path.join(__dirname)
const PID_PATH = path.join(DATA_PATH, 'prosody.pid')
const PROSODY_PORT = 5347

function clean() {
  return Promise.all(
    ['prosody.err', 'prosody.log', 'prosody.pid'].map(file =>
      removeFile(path.join(__dirname, file))
    )
  ).catch(() => {})
}

function isPortOpen() {
  const sock = new net.Socket()
  sock.connect({port: PROSODY_PORT})
  return promise(sock, 'connect')
    .then(() => {
      sock.end()
      sock.destroy()
      return true
    })
    .catch(() => false)
}

async function waitPortOpen() {
  if (await isPortOpen()) {
    return
  }

  await delay(1000)
  return waitPortOpen()
}

async function waitPortClose() {
  if (!(await isPortOpen())) {
    return
  }

  await delay(1000)
  return waitPortClose()
}

async function kill(signal = 'SIGTERM') {
  const pid = await getPid()
  try {
    process.kill(pid, signal)
  } catch (err) {
    if (err.code !== 'ESRCH') throw err
  }
}

async function getPid() {
  try {
    return await readFile(PID_PATH, 'utf8')
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    return ''
  }
}

async function _start() {
  const opening = waitPortOpen()

  await exec('prosody', {
    cwd: DATA_PATH,
    env: {
      ...process.env,
      PROSODY_CONFIG: 'prosody.cfg.lua',
    },
  })

  return opening
}

async function start() {
  if (await isPortOpen()) return
  await clean()
  return _start()
}

async function stop(signal) {
  if (!(await isPortOpen())) {
    return clean()
  }

  const closing = waitPortClose()
  await kill(signal)
  return closing
}

async function restart(signal) {
  await stop(signal)
  return _start()
}

exports.isPortOpen = isPortOpen
exports.waitPortClose = waitPortClose
exports.waitPortOpen = waitPortOpen
exports.getPid = getPid
exports.start = start
exports.stop = stop
exports.restart = restart
exports.kill = kill
