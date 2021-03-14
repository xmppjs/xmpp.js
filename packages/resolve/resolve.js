"use strict";

const dns = require("./lib/dns");
const http = require("./lib/http");

module.exports = function resolve(...args) {
  return Promise.all([
    dns.resolve ? dns.resolve(...args) : Promise.resolve([]),
    http.resolve(...args),
  ]).then(([records, endpoints]) => [...records, ...endpoints]);
};

if (dns.resolve) {
  module.exports.dns = dns;
}

module.exports.http = http;
