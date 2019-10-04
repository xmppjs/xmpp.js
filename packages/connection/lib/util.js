'use strict'

function parseURI(URI) {
  let {port, hostname, protocol} = new URL(URI)
  // https://github.com/nodejs/node/issues/12410#issuecomment-294138912
  if (hostname === '[::1]') {
    hostname = '::1'
  }

  return {port, hostname, protocol}
}

function parseHost(host) {
  const {port, hostname} = parseURI(`http://${host}`)
  return {port, hostname}
}

function parseService(service) {
  return service.includes('://') ? parseURI(service) : parseHost(service)
}

Object.assign(module.exports, {parseURI, parseHost, parseService})
