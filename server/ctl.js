#!/usr/bin/env node

'use strict' // eslint-disable-line node/shebang

const server = require('.')

const method = process.argv[2]

const commands = {
  start() {
    return server.start()
  },
  stop() {
    return server.stop()
  },
  restart() {
    return server.restart()
  },
  async status() {
    const isStarted = await server.isPortOpen()
    if (isStarted) {
      console.log('started')
    } else {
      console.log('stopped')
    }
  },
}

if (commands[method]) {
  commands[method]().catch(console.error)
} else {
  console.error('Valid commands are start/stop/restart/status.')
}
