#!/usr/bin/env node

'use strict'

const url = require('url')

const readline = require('readline')
const chalk = require('chalk')

const component = require('@xmpp/component')
const client = require('@xmpp/client')
const xml = require('@xmpp/xml')
const jid = require('@xmpp/jid')

const [,, uri, password] = process.argv
const protocol = url.parse(uri).protocol
const address = jid(uri.split(protocol + '//')[1])
const entity = address.local ? client() : component()

function beautify (el) {
  return xml.stringify(el, '  ').trim()
}

function send (line) {
  let el
  try {
    el = xml.parse(line)
  } catch (err) {
    log(`${chalk.red.bold('❌')} invalid XML "${line}"`, err)
    return
  }

  if (!address.local && !el.attrs.to) {
    const domain = entity._domain
    el.attrs.to = domain.substr(domain.indexOf('.') + 1) // FIXME in component-core
  }
  entity.send(el)
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
  if (line) send(line)
  rl.prompt()
})

function log (...args) {
  readline.cursorTo(process.stdout, 0)
  console.log(...args)
  rl.prompt()
}

function info (...args) {
  log(chalk.cyan.bold('🛈'), ...args)
}

// function warning (...args) {
//   log(chalk.yellow.bold('⚠'), ...args)
// }

function error (...args) {
  log(chalk.red.bold('❌'), ...args)
}

entity.on('connect', () => {
  info('connected')
})

entity.on('open', () => {
  info('open')
})

entity.on('authenticated', () => {
  info('authenticated')
})

entity.on('online', (jid) => {
  info('online', chalk.grey(jid.toString()))
})

entity.on('authenticate', auth => {
  info('authenticating')
  address.local ? auth(address.local, password) : auth(password)
})

entity.on('starttls', (starttls) => {
  starttls({
    rejectUnauthorized: false
  })
})

entity.on('nonza', el => {
  log(chalk.green.bold('⮈ IN\n') + beautify(el))
})

entity.on('stanza', el => {
  log(chalk.green.bold('⮈ IN\n') + beautify(el))
})

entity.on('send', el => {
  log(chalk.magenta.bold('⮊ OUT\n') + beautify(el))
})

entity.start(uri)

process.on('unhandledRejection', (reason) => {
  error(reason)
  process.exit(1)
})
