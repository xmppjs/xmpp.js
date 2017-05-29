'use strict'

const dns = require('dns');

function lookup(domain, options = {}) {
  options.all = true
  return new Promise((resolve, reject) => {
    dns.lookup(domain, options, (err, addresses) => {
      if (err) reject(err)
      else resolve(addresses)
    })
  })
}

function resolveSrv(domain, {service, protocol}) {
  return new Promise((resolve, reject) => {
    dns.resolveSrv(`_${service}._${protocol}.${domain}`, (err, addresses) => {
      if (err) reject(err)
      else resolve(addresses)
    })
  })
}

function lookupSrvs(srvs, options) {
  const addresses = []
  return Promise.all(srvs.map((srv) => {
    return lookup(srv.name, options).then((srvAddresses) => {
      srvAddresses.forEach((address) => {
        addresses.push(Object.assign({}, address, srv))
      })
    })
  })).then(() => addresses)
}

function resolve(domain, options) {
  return lookup(domain, options).then((addresses) => {
    return resolveSrv(domain, options).then((srvAddresses) => {
      return lookupSrvs(srvAddresses, options)
    }).then((srvAddresses) => {
      return srvAddresses.concat(addresses)
    })
  })
}

function sort(addresses) {
  return addresses.sort((a, b) => {
    const priority = a.priority - b.priority
    if (priority !== 0) return priority

    const weight = a.weight - b.weight
    if (weight !== 0) return weight

    return 0
  })
}

module.exports.lookup = lookup
module.exports.resolveSrv = resolveSrv
module.exports.lookupSrvs = lookupSrvs
module.exports.resolve = resolve
module.exports.sort = sort

resolve('xmpp.org', {service: 'xmpp-client', protocol: 'tcp', family: null}).then((addresses) => {
  console.log(addresses)
  // console.log(sort(addresses))
}).catch((err) => {
  console.error(err)
})
