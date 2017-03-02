'use strict'

const Plugin = require('../../lib/Plugin')

class StreamFeaturesPlugin extends Plugin {
  constructor (...args) {
    super(...args)
    this.features = []
    this.negotiated = []
    this.enable() // FIXME
  }

  enable () {
    const {entity} = this
    this.entity.on('nonza', el => {
      if (el.name !== 'stream:features') return

      const streamFeatures = this.selectFeatures(el)
      if (streamFeatures.length === 0) return

      const features = streamFeatures.map((feature) => {
        return {
          name: feature.name,
          run: (...args) => {
            return feature.run(entity, el, ...args).then(() => {
              if (feature.restart) {
                return entity.restart()
              } else if (entity.jid) {
                entity._online(entity.jid)
              } else {
                this.onStreamFeatures(features, el)
              }
            }).catch(err => entity.emit('error', err))
          }
        }
      })

      this.onStreamFeatures(features, el)
    })
  }

  disable () {
    // FIXME
  }

  selectFeatures (el) {
    return this.features
      .filter(f => f.match(el, this.entity) && this.negotiated.indexOf(f) === -1 && typeof f.priority === 'number')
      .sort((a, b) => {
        return a.priority < b.priority
      })
  }

  onStreamFeatures (features) {
    const feature = features.shift()
    feature.run()
  }

  add ({name, priority, run, match, restart}) {
    this.features.push({name, priority, run, match, restart})
  }
}

module.exports = StreamFeaturesPlugin
