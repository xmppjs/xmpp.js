var async = require('async');
var xmpp = require('../../lib/node-xmpp');
var http = require('http');
http.globalAgent.maxSockets = 9999999;

function getNow() {
    return new Date().getTime();
}

function connectThem(n, opts, cb) {
    var funs = [];
    for(var i = 0; i < n; i++) {
	funs.push(function(cb2) {
	    var cl = new xmpp.Client(opts);
	    cl.on('online', function() {
		cb2(null, cl);
	    });
	});
    }
    async.parallel(funs, cb);
}


const SIZES = [1, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
// TODO: wait for 'close' after end()
async.forEachSeries(SIZES, function(n, cb) {
    async.series([function(cb2) {
	console.log("Connecting", n);
	var t1 = getNow();
	connectThem(n, {
	    jid: "test@localhost",
	    password: "test",
	    host: "::1",
	    port: 25222
	}, function(e, clients) {
	    console.log("Connected",n,"in",getNow() - t1,"ms");
	    async.forEachSeries(clients, function(cl, cb3) {
		cl.connection.on('close', function() {
		    cb3()
		});
		cl.end();
	    }, cb2);
	});
    }, function(cb2) {
	console.log("Connecting (BOSH)", n);
	var t1 = getNow();
	connectThem(n, {
	    jid: "test@localhost",
	    password: "test",
	    boshURL: "http://localhost:25280"
	}, function(e, clients) {
	    console.log("Connected",n,"in",getNow() - t1,"ms");
	    async.forEachSeries(clients, function(cl, cb3) {
		cl.connection.on('close', function() {
		    cb3()
		});
		cl.end();
	    }, cb2);
	});
    }], cb);
});