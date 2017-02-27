#!/usr/bin/env node

'use strict'

const readline = require('readline')
const chalk = require('chalk')

const component = require('@xmpp/component')
const client = require('@xmpp/client')
const jid = require('@xmpp/jid')
const Console = require('./lib/Console')

module.exports = function (flags, params) {
  const address = jid(params.jid)

  const entity = address.local ? client() : component()
  const xconsole = new Console(entity, address)
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
    this.log(chalk.red.bold('❌') + ' error\n', ...args)
  }
  xconsole.input = function (el) {
    this.log(chalk.green.bold('⮈ IN\n') + this.beautify(el))
  }
  xconsole.output = function (el) {
    this.log(chalk.magenta.bold('⮊ OUT\n') + this.beautify(el))
  }

  const options = {
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.magenta.bold('✏ ')
  }
  if (parseInt(process.env.NODE_NO_READLINE)) {
    options.terminal = false
  }

  const rl = readline.createInterface(options)

  rl.prompt(true)

  rl.on('line', (line) => {
    // clear stdin - any better idea? please contribute
    readline.moveCursor(process.stdout, 0, -1)
    readline.clearLine(process.stdout, 0)

    line = line.trim()
    if (line) xconsole.send(line)
    else rl.prompt()
  })

  entity.on('authenticate', auth => {
    address.local ? auth(address.local, params.password) : auth(params.password)
  })

  entity.on('starttls', (starttls) => {
    starttls({
      rejectUnauthorized: false
    })
  })

  entity.start(params.endpoint)
}
