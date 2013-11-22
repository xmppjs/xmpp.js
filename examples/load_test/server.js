'use strict';

var http = require('http')
  , xmpp = require('../../index')
  , C2SStream = require('node-xmpp-server/lib/c2s/stream')

var tcpClients = 0,
    boshClients = 0,
    authedClients = 0

var sv = new xmpp.C2SServer({ port: 25222 })

sv.on('connect', function(svcl) {
    tcpClients++
    svcl.on('close', function() {
        tcpClients--
    })
    svcl.on('authenticate', function(opts, cb) {
        authedClients++
        svcl.on('close', function() {
            authedClients--
        })
        cb()
    })
})

var bosh = new xmpp.BOSHServer()
http.createServer(function(req, res) {
    try {
        bosh.handleHTTP(req, res)
    } catch(e) {
        console.error(e.stack||e)
    }
}).listen(25280)
bosh.on('connect', function(svcl) {
    boshClients++
    svcl.on('close', function() {
        boshClients--
    })
    var c2s = new C2SStream({ connection: svcl })
    c2s.on('authenticate', function(opts, cb) {
        authedClients++
        svcl.on('close', function() {
            authedClients--
        })
        cb()
    })
    c2s.on('error', function(e) {
        console.error('Error', e)
    })
})

setInterval(function() {
    console.log(
        'TCP',
        tcpClients,
        'BOSH',
        boshClients,
        'authed',
        authedClients,
        'RSS MB',
        Math.ceil(process.memoryUsage().rss / 1024 / 1024)
    )

    var inCount = 0
      , outCount = 0

    for (var k in bosh.sessions) {
        var session = bosh.sessions[k]
        /* jshint unused: false */
        for (var j in session.inQueue) inCount++
        outCount += session.outQueue.length
    }
    console.log('BOSH inQueue', inCount, 'BOSH outQueue', outCount)

}, 1000)
