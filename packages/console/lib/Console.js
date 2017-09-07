'use strict'

const mapSeries = require('p-map-series')
const EventEmitter = require('events')
const {parse, stringify} = require('ltx')

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

    const {sasl, register, bind, streamFeatures} = entity.plugins
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
    if (sasl) {
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
        }).then(username => {
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

    entity.handle('authenticate', (auth, mechanism) => {
      const options = [
        {
          text: 'Enter password',
          type: 'password',
        },
      ]

      // Client
      if (mechanism) {
        options.unshift({
          text: 'enter username',
        })
      }

      return this.askMultiple(options)
        .then(data => auth(...data))
        .catch(err => {
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
        el = parse(frag)
      } catch (err) {
        return frag
      }
    } else {
      el = frag
    }
    return stringify(el, '  ')
  }

  askMultiple(options) {
    return mapSeries(options, o => this.ask(o))
  }

  parse(str) {
    try {
      return parse(str)
    } catch (err) {
      return str
    }
  }

  send(data) {
    let el
    try {
      el = parse(data)
    } catch (err) {
      this.error(`invalid XML "${data}"`)
      return
    }

    this.entity.send(el).then(() => {
      this.resetInput()
    })
  }

  resetInput() {}

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
    this.log('❌ error ', ...args)
  }
}

module.exports = Console
