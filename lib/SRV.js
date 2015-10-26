'use strict'

var dns = require('dns')

function compareNumbers (a, b) {
  a = parseInt(a, 10)
  b = parseInt(b, 10)
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}

function groupSrvRecords (addrs) {
  var groups = {} // by priority
  addrs.forEach(function (addr) {
    if (!groups.hasOwnProperty(addr.priority)) {
      groups[addr.priority] = []
    }

    groups[addr.priority].push(addr)
  })

  var result = []
  Object.keys(groups).sort(compareNumbers).forEach(function (priority) {
    var group = groups[priority]
    var totalWeight = 0
    group.forEach(function (addr) {
      totalWeight += addr.weight
    })
    var w = Math.floor(Math.random() * totalWeight)
    totalWeight = 0
    var candidate = group[0]
    group.forEach(function (addr) {
      totalWeight += addr.weight
      if (w < totalWeight) {
        candidate = addr
      }
    })
    if (candidate) {
      result.push(candidate)
    }
  })
  return result
}

function resolveSrv (name, cb) {
  dns.resolveSrv(name, function (err, addrs) {
    if (err) {
      /* no SRV record, try domain as A */
      cb(err)
    } else {
      var pending = 0
      var error
      var results = []
      var cb1 = function (e, addrs1) {
        error = error || e
        results = results.concat(addrs1)
        pending--
        if (pending < 1) {
          cb(results ? null : error, results)
        }
      }
      var gSRV = groupSrvRecords(addrs)
      pending = gSRV.length
      gSRV.forEach(function (addr) {
        resolveHost(addr.name, function (e, a) {
          if (a) {
            a = a.map(function (a1) {
              return { name: a1, port: addr.port }
            })
          }
          cb1(e, a)
        })
      })
    }
  })
}

// one of both A & AAAA, in case of broken tunnels
function resolveHost (name, cb) {
  var error
  var results = []
  var cb1 = function (e, addr) {
    error = error || e
    if (addr) {
      results.push(addr)
    }

    cb((results.length > 0) ? null : error, results)
  }

  dns.lookup(name, cb1)
}

// connection attempts to multiple addresses in a row
function tryConnect (connection, addrs) {
  connection.on('connect', cleanup)
  connection.on('disconnect', connectNext)
  return connectNext()

  function cleanup () {
    connection.removeListener('connect', cleanup)
    connection.removeListener('disconnect', connectNext)
  }

  function connectNext () {
    var addr = addrs.shift()
    if (addr) {
      connection.socket.connect(addr.port, addr.name)
    } else {
      cleanup()
    }
  }
}

// returns a lazy iterator which can be restarted via connection.connect()
exports.connect = function connect (opts) {
  var services = opts.services.slice()
  // lazy evaluation to determine endpoint
  function tryServices (retry) {
    var connection = this
    if (!connection.socket && opts.socket) {
      if (typeof opts.socket === 'function') {
        connection.socket = opts.socket.call(this)
      } else {
        connection.socket = opts.socket
      }
      opts.socket = null
    } else if (!retry) {
      connection.socket = null
    }
    var service = services.shift()
    if (service) {
      resolveSrv(service + '.' + opts.domain, function (error, addrs) {
        if (!error && addrs) {
          tryConnect(connection, addrs)
        // call tryServices again
        } else {
          tryServices.call(connection, 'retry')
        }
      })
    } else {
      resolveHost(opts.domain, function (error, addrs) {
        if (addrs && addrs.length > 0) {
          addrs = addrs.map(function (addr) {
            return {
              name: addr,
              port: opts.defaultPort
            }
          })
          tryConnect(connection, addrs)
        } else if (connection.reconnect) {
          // retry from the beginning
          services = opts.services.slice()
          // get a new socket
          connection.socket = null
        } else {
          error = error || new Error('No addresses resolved for ' +
              opts.domain)
          connection.emit('error', error)
        }
      })
    }
    return connection.socket
  }
  return tryServices
}
