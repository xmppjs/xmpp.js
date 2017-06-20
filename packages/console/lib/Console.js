'use strict'

const Promise = require('bluebird')
const EventEmitter = require('events')
const xml = require('@xmpp/xml')

class Console extends EventEmitter {
  constructor(entity) {
    super()
    this.entity = entity

    entity.on('input', data => this.input(data))
    entity.on('output', data => this.output(data))

    entity.on('connect', () => {
      this.info('connected')
    })

    entity.on('open', () => {
      this.info('open')
    })

    entity.on('authenticated', () => {
      this.info('authenticated')
    })

    entity.on('online', jid => {
      this.jid = jid
      this.info(`online ${jid.toString()}`)
    })

    entity.on('error', err => {
      this.error(err.message)
    })

    entity.on('close', () => {
      this.info('closed')
    })

    entity.on('authenticate', () => {
      this.info('authenticating')
    })

    const streamFeatures = entity.plugins['stream-features']
    if (streamFeatures) {
      streamFeatures.onStreamFeatures = features => {
        const options = {
          text: 'Choose stream feature',
          cancelText: 'Done',
          choices: features.map(({name}) => name),
        }
        this.choose(options).then(feature => {
          return features.find(f => f.name === feature).run()
        })
      }
    }

    const {sasl, register, bind} = entity.plugins
    if (sasl) {
      sasl.getCredentials = () => {
        return this.askMultiple([
          {
            text: 'enter username',
          },
          {
            text: 'Enter password',
            type: 'password',
          },
        ])
      }
      sasl.getMechanism = mechs => {
        return this.choose({
          text: 'Choose SASL mechanism',
          choices: mechs,
        })
      }
    }
    if (register) {
      register.onFields = (fields, register) => {
        return this.ask({
          text: 'Choose username',
        })
          .then(username => {
            return this.ask({
              text: 'Choose password',
              type: 'password',
            }).then(password => register(username, password))
          })
      }
    }
    if (bind) {
      bind.getResource = () => {
        return this.ask({
          text: 'Enter resource or leave empty',
          value: 'console',
        })
      }
    }

    // Component
    entity.on('authenticate', auth => {
      this.ask({
        text: 'Enter password',
      }).then(auth).catch(err => {
        this.error('authentication', err.message)
      })
    })

    entity.on('connect', () => {
      this.ask({
        text: 'Enter domain',
        value: 'localhost',
      }).then(domain => {
        entity.open({domain}).catch(err => {
          this.error('open - ', err.message)
        })
      })
    })
  }

  input(el) {
    this.log('⮈ IN', this.beautify(el))
  }

  output(el) {
    this.log('⮊ OUT', this.beautify(el))
  }

  beautify(frag) {
    let el
    if (typeof frag === 'string') {
      try {
        el = xml.parse(frag)
      } catch (err) {
        return frag
      }
    } else {
      el = frag
    }
    return xml.stringify(el, '  ')
  }

  askMultiple(options) {
    return Promise.mapSeries(options, o => this.ask(o))
  }

  parse(str) {
    try {
      return xml.parse(str)
    } catch (err) {
      return str
    }
  }

  send(data) {
    let el
    try {
      el = xml.parse(data)
    } catch (err) {
      this.error(`invalid XML "${data}"`)
      return
    }

    this.entity.send(el).then(() => {
      this.resetInput()
    })
  }

  resetInput() {
  }

  log(...args) {
    console.log(...args)
  }

  info(...args) {
    this.log('🛈 ', ...args)
  }

  warning(...args) {
    this.log('⚠ ', ...args)
  }

  error(...args) {
    this.log('❌ error', ...args)
  }
}

module.exports = Console
