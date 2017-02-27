'use strict'

const EventEmitter = require('events')
const xml = require('@xmpp/xml')

function trim (el) {
  el.children.forEach((child, idx) => {
    if (typeof child === 'string') el.children[idx] = child.trim()
    else trim (child)
  })
  return el
}

class Console extends EventEmitter {
  constructor (entity, address) {
    super()
    this.entity = entity
    this.address = address

    entity.on('nonza', el => {
      this.input(el)
    })

    entity.on('stanza', el => {
      this.input(el)
    })

    entity.on('send', el => {
      this.output(el)
    })

    entity.on('connect', () => {
      this.info('connected')
    })

    entity.on('open', () => {
      this.info('open')
    })

    entity.on('authenticated', () => {
      this.info('authenticated')
    })

    entity.on('online', (jid) => {
      this.info(`online ${jid.toString()}`)
    })

    entity.on('ready', (jid) => {
      this.info(`ready ${jid.toString()}`)
    })

    entity.on('error', (err) => {
      this.error(err)
    })

    entity.on('authenticate', auth => {
      this.info('authenticating')
    })
  }

  input (el) {
    this.log('⮈ IN', this.beautify(el))
  }

  output (el) {
    this.log('⮊ OUT', this.beautify(el))
  }

  beautify (el) {
    return xml.stringify(trim(el), '  ').trim()
  }

  send (data) {
    let el
    try {
      el = xml.parse(data)
    } catch (err) {
      this.error(`invalid XML "${data}"`, err)
      return
    }

    if (!this.address.local && !el.attrs.to) {
      const domain = this.entity._domain
      el.attrs.to = domain.substr(domain.indexOf('.') + 1) // FIXME in component-core
    }
    this.entity.send(el).then(() => {
      this.resetInput()
    })
  }

  resetInput () {
  }

  log (...args) {
    console.log(...args)
  }

  info (...args) {
    this.log('🛈 ', ...args)
  }

  warning (...args) {
    this.log('⚠ ', ...args)
  }

  error (...args) {
    this.log('❌ error\n', ...args)
  }
}

module.exports = Console
