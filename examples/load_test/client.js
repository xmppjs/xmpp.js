'use strict';

var async = require('async')
  , xmpp = require('../../index')
  , http = require('http')

http.globalAgent.maxSockets = 9999999

function getNow() {
    return new Date().getTime()
}

function connectThem(n, opts, cb) {
    var queue = async.queue(function(task, cb) {
        var cl = new xmpp.Client(opts)
        cl.on('online', function() {
            cb(null, cl)
        })
        cl.on('error', function(e) {
            cb(e)
        })
    }, 100)

    var cls = []
    var done = 0
    /* jshint -W083 */
    for (var i = 0; i < n; i++) {
        queue.push({}, function(err, cl) {
            if (cl) cls.push(cl)
            done++
            if (done >= n) cb(null, cls)
        })
    }
}


var SIZES = [1, 5, 10, 20, 50, 100, 200, 500, 1000, 1500, 5000]
// TODO: wait for 'close' after end()
async.forEachSeries(SIZES, function(n, cb) {
    async.series([function(cb2) {
        console.log('Connecting', n)
        var t1 = getNow()
        connectThem(n, {
            jid: 'test@localhost',
            password: 'test',
            host: '::1',
            port: 25222
        }, function(e, clients) {
            console.log('Connected',n,'in',getNow() - t1,'ms')
            async.forEachSeries(clients, function(cl, cb3) {
                cl.on('close', function() {
                    cb3()
                })
                cl.end()
            }, cb2)
        })
    }, function(cb2) {
        console.log('Connecting (BOSH)', n)
        var t1 = getNow()
        connectThem(n, {
            jid: 'test@localhost',
            password: 'test',
            boshURL: 'http://127.0.0.1:25280'
        }, function(e, clients) {
            console.log('Connected',n,'in',getNow() - t1,'ms')
            async.forEachSeries(clients, function(cl, cb3) {
                cl.on('close', function() {
                    cb3()
                })
                cl.end()
            }, cb2)
        })
    }], cb)
})
