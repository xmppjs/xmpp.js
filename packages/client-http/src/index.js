import nodeFetch from 'node-fetch'

const fetch = global.fetch || nodeFetch

export function http (url, options) {
  return fetch(url, options)
}
