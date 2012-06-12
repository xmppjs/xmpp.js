var dns = require('dns');
var EventEmitter = require('events').EventEmitter;

function compareNumbers(a, b) {
    a = parseInt(a, 10);
    b = parseInt(b, 10);
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}

function groupSrvRecords(addrs) {
    var groups = {};  // by priority
    addrs.forEach(function(addr) {
                      if (!groups.hasOwnProperty(addr.priority))
                          groups[addr.priority] = [];

                      groups[addr.priority].push(addr);
                  });

    var result = [];
    Object.keys(groups).sort(compareNumbers).forEach(function(priority) {
        var group = groups[priority];
        var totalWeight = 0;
        group.forEach(function(addr) {
            totalWeight += addr.weight;
        });
        var w = Math.floor(Math.random() * totalWeight);
        totalWeight = 0;
        var candidate = group[0];
        group.forEach(function(addr) {
            totalWeight += addr.weight;
            if (w < totalWeight)
                candidate = addr;
        });
        if (candidate)
            result.push(candidate);
    });
    return result;
}

function resolveSrv(name, cb) {
    dns.resolveSrv(name, function(err, addrs) {
        if (err) {
            /* no SRV record, try domain as A */
            cb(err);
        } else {
            var pending = 0, error, results = [];
            var cb1 = function(e, addrs1) {
                error = error || e;
                results = results.concat(addrs1);
                pending--;
                if (pending < 1) {
                    cb(results ? null : error, results);
                }
            };
	    var gSRV = groupSrvRecords(addrs);
	    pending = gSRV.length;
	    gSRV.forEach(function(addr) {
                resolveHost(addr.name, function(e, a) {
                    if (a)
                        a = a.map(function(a1) {
                                      return { name: a1,
                                               port: addr.port };
                                  });
                    cb1(e, a);
                });
            });
        }
    });
}

// one of both A & AAAA, in case of broken tunnels
function resolveHost(name, cb) {
    var error, results = [];
    var cb1 = function(e, addr) {
        error = error || e;
        if (addr)
            results.push(addr);

        cb((results.length > 0) ? null : error, results);
    };

    dns.lookup(name, cb1);
}

// connection attempts to multiple addresses in a row
function tryConnect(socket, addrs, listener) {
    var onConnect = function() {
        socket.removeListener('connect', onConnect);
        socket.removeListener('error', onError);
        // done!
        listener.emit('connect');
    };
    var error;
    var onError = function(e) {
        error = e;
        connectNext();
    };
    var connectNext = function() {
        var addr = addrs.shift();
        if (addr)
            socket.connect(addr.port, addr.name);
        else {
            socket.removeListener('connect', onConnect);
            socket.removeListener('error', onError);
            listener.emit('error', error || new Error('No addresses to connect to'));
	}
    };
    socket.addListener('connect', onConnect);
    socket.addListener('error', onError);
    connectNext();
}

// returns EventEmitter with 'connect' & 'error'
exports.connect = function(socket, services, domain, defaultPort) {
    var listener = new EventEmitter();

    var tryServices = function() {
        var service = services.shift();
        if (service) {
            resolveSrv(service + '.' + domain, function(error, addrs) {
                if (addrs)
                    tryConnect(socket, addrs, listener);
                else
                    tryServices();
            });
        } else {
            resolveHost(domain, function(error, addrs) {
                if (addrs && addrs.length > 0) {
                    addrs = addrs.map(function(addr) {
                        return { name: addr,
                                 port: defaultPort };
                    });
                    tryConnect(socket, addrs, listener);
                }
                else {
                    listener.emit('error', error || new Error('No addresses resolved for ' + domain));
                }
            });
        }

    };
    tryServices();

    return listener;
};
