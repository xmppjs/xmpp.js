'use strict';


var dns = require('dns')

function compareNumbers(a, b) {
    a = parseInt(a, 10)
    b = parseInt(b, 10)
    if (a < b)
        return -1
    if (a > b)
        return 1
    return 0
}

function groupSrvRecords(addrs) {
    var groups = {}  // by priority
    addrs.forEach(function(addr) {
        if (!groups.hasOwnProperty(addr.priority))
            groups[addr.priority] = []

        groups[addr.priority].push(addr)
    })

    var result = []
    Object.keys(groups).sort(compareNumbers).forEach(function(priority) {
        var group = groups[priority]
        var totalWeight = 0
        group.forEach(function(addr) {
            totalWeight += addr.weight
        })
        var w = Math.floor(Math.random() * totalWeight)
        totalWeight = 0
        var candidate = group[0]
        group.forEach(function(addr) {
            totalWeight += addr.weight
            if (w < totalWeight)
                candidate = addr
        })
        if (candidate)
            result.push(candidate)
    })
    return result
}

function resolveSrv(name, cb) {
    dns.resolveSrv(name, function(err, addrs) {
        if (err) {
            /* no SRV record, try domain as A */
            cb(err)
        } else {
            var pending = 0, error, results = []
            var cb1 = function(e, addrs1) {
                error = error || e
                results = results.concat(addrs1)
                pending--
                if (pending < 1) {
                    cb(results ? null : error, results)
                }
            }
            var gSRV = groupSrvRecords(addrs)
            pending = gSRV.length
            gSRV.forEach(function(addr) {
                resolveHost(addr.name, function(e, a) {
                    if (a) {
                        a = a.map(function(a1) {
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
function resolveHost(name, cb) {
    var error, results = []
    var cb1 = function(e, addr) {
        error = error || e
        if (addr)
            results.push(addr)

        cb((results.length > 0) ? null : error, results)
    }

    dns.lookup(name, cb1)
}

// connection attempts to multiple addresses in a row
function tryConnect(connection, addrs, callback) {
    connection.on('connect', onConnect)
    connection.on('disconnect', connectNext)
    return connectNext()

    function onConnect() {
        connection.removeListener('connect', onConnect)
        connection.removeListener('disconnect', connectNext)
        if (callback)
            callback()
    }

    function connectNext() {
        var addr = addrs.shift()
        if (addr)
            connection.socket.connect(addr.port, addr.name)
        else {
            connection.removeListener('connect', onConnect)
            connection.removeListener('disconnect', connectNext)
            // call tryServices again
            connection.connect()
        }
    }
}

// returns a lazy iterator which can be retriggered via connection.connect()
exports.connect = function connect(opts) {
    var halt = false, resolveNeeded = true
    // lazy evaluation to determine endpoint
    return function tryServices() {
        if (halt) return // create a new socket
        if (!resolveNeeded) return opts.connection.socket
        var service = opts.services.shift()
        if (service) {
            resolveSrv(service + '.' + opts.domain, function(error, addrs) {
                if (addrs)
                    tryConnect(opts.connection, addrs, function success() {
                        resolveNeeded = false
                    })
                else tryServices()
            })
        } else {
            resolveNeeded = false
            resolveHost(opts.domain, function(error, addrs) {
                halt = true
                if (addrs && addrs.length > 0) {
                    addrs = addrs.map(function(addr) {
                        return { name: addr,
                                 port: opts.defaultPort }
                    })
                    tryConnect(opts.connection, addrs)
                } else {
                    error = error || new Error('No addresses resolved for ' +
                                                opts.domain)
                    opts.connection.emit('error', error)
                }
            })
        }
        return opts.connection.socket
    }
}
