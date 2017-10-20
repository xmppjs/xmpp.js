'use strict'

const route = require('./route')

module.exports = middleware => {
  return {
    use(...args) {
      middleware.use(route(...args))
    },
    filter(...args) {
      middleware.filter(route(...args))
    },

    error(...args) {
      this.use('message-error', ...args)
      this.use('presence-error', ...args)
      this.use('iq-error', ...args)
    },

    message(...args) {
      this.use('message', ...args)
    },
    chat(...args) {
      this.use('message-chat', ...args)
    },
    groupchat(...args) {
      this.use('message-groupchat', ...args)
    },
    normal(...args) {
      this.use('message-normal', ...args)
    },
    headline(...args) {
      this.use('message-headline', ...args)
    },

    presence(...args) {
      this.use('presence', ...args)
    },
    subscribe(...args) {
      this.use('presence-subscribe', ...args)
    },
    ubsubscribe(...args) {
      this.use('presence-unsubscribe', ...args)
    },
    available(...args) {
      this.use('presence-available', ...args)
    },
    unavailable(...args) {
      this.use('presence-unavailable', ...args)
    },

    iq(...args) {
      this.use('iq', ...args)
    },
    get(...args) {
      this.use('iq-get', ...args)
    },
    set(...args) {
      this.use('iq-set', ...args)
    },
    result(...args) {
      this.use('iq-result', ...args)
    },
  }
}
