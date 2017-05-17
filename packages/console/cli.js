#!/usr/bin/env node

'use strict'

const readline = require('readline')
const chalk = require('chalk')

const component = require('@xmpp/component')
const client = require('@xmpp/client')
const Console = require('./lib/Console')

module.exports = function (flags, endpoint) {
  const options = {
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.magenta.bold('✏ ')
  }
  if (parseInt(process.env.NODE_NO_READLINE)) {
    options.terminal = false
  }
  const rl = readline.createInterface(options)

  let prevent = false

  const entity = flags.type === 'component' ? component() : client()
  const xconsole = new Console(entity)
  xconsole.resetInput = function () {
    rl.prompt()
  }
  xconsole.log = function (...args) {
    readline.cursorTo(process.stdout, 0)
    console.log(...args)
    rl.prompt()
  }
  xconsole.info = function (...args) {
    this.log(chalk.cyan.bold('🛈'), ...args)
  }
  xconsole.warning = function (...args) {
    this.log(chalk.yellow.bold('⚠'), ...args)
  }
  xconsole.error = function (...args) {
    this.log(chalk.red.bold('❌') + ' error', ...args)
  }
  xconsole.input = function (el) {
    this.log(chalk.green.bold('⮈ IN\n') + this.beautify(el))
  }
  xconsole.output = function (el) {
    this.log(chalk.magenta.bold('⮊ OUT\n') + this.beautify(el))
  }
  xconsole.choose = function (options) {
    return new Promise((resolve) => {
      this.log(chalk.yellow.bold('?'), options.text, ':', options.choices.join(', '))
      prevent = true
      rl.on('line', (line) => {
        prevent = false
        resolve(line)
      })
    })
  }
  xconsole.ask = function (options) {
    return new Promise((resolve) => {
      this.log(chalk.yellow.bold('?'), options.text)
      prevent = true
      rl.on('line', (line) => {
        prevent = false
        resolve(line)
      })
    })
  }

  rl.prompt(true)

  rl.on('line', (line) => {
    if (prevent) return
    // clear stdin - any better idea? please contribute
    readline.moveCursor(process.stdout, 0, -1)
    readline.clearLine(process.stdout, 0)

    line = line.trim()
    if (line) xconsole.send(line)
    else rl.prompt()
  })

  rl.on('close', () => {
    process.exit()
  })

  entity.on('close', () => {
    process.exit()
  })

  if (endpoint) {
    entity.connect(endpoint)
  } else {
    xconsole.ask({
      text: 'Enter endpoint',
      value: 'ws://localhost:5280/xmpp-websocket',
      type: 'url'
    }).then((endpoint) => {
      return entity.connect(endpoint)
    })
  }
}
