/* eslint-disable promise/no-nesting */
"use strict";

const dns = require("dns");

// eslint-disable-next-line unicorn/prefer-set-has
const IGNORE_CODES = ["ENOTFOUND", "ENODATA"];

function lookup(domain, options = {}) {
  options.all = true;
  return new Promise((resolve, reject) => {
    dns.lookup(domain, options, (err, addresses) => {
      if (err) {
        return reject(err);
      }

      const result = [];
      for (const { family, address } of addresses) {
        const uri = `://${family === 4 ? address : "[" + address + "]"}:`;
        result.push(
          {
            family,
            address,
            uri: "xmpps" + uri + "5223",
          },
          {
            family,
            address,
            uri: "xmpp" + uri + "5222",
          },
        );
      }
      resolve(result);
    });
  });
}

function resolveSrv(domain, { service, protocol }) {
  return new Promise((resolve, reject) => {
    dns.resolveSrv(`_${service}._${protocol}.${domain}`, (err, records) => {
      if (err && IGNORE_CODES.includes(err.code)) {
        resolve([]);
      } else if (err) {
        reject(err);
      } else {
        resolve(
          records.map((record) => {
            return Object.assign(record, { service, protocol });
          }),
        );
      }
    });
  });
}

function sortSrv(records) {
  return records.sort((a, b) => {
    const priority = a.priority - b.priority;
    if (priority !== 0) {
      return priority;
    }

    const weight = b.weight - a.weight;
    if (weight !== 0) {
      return weight;
    }

    return 0;
  });
}

function lookupSrvs(srvs, options) {
  const addresses = [];
  return Promise.all(
    srvs.map(async (srv) => {
      const srvAddresses = await lookup(srv.name, options);
      for (const address of srvAddresses) {
        const { port, service } = srv;
        const addr = address.address;
        addresses.push({
          ...address,
          ...srv,
          uri: `${service.split("-")[0]}://${
            address.family === 6 ? "[" + addr + "]" : addr
          }:${port}`,
        });
      }
    }),
  ).then(() => addresses);
}

function resolve(domain, options = {}) {
  if (!options.srv) {
    options.srv = [
      {
        service: "xmpps-client",
        protocol: "tcp",
      },
      {
        service: "xmpp-client",
        protocol: "tcp",
      },
      {
        service: "xmpps-server",
        protocol: "tcp",
      },
      {
        service: "xmpp-server",
        protocol: "tcp",
      },
      {
        service: "stun",
        protocol: "tcp",
      },
      {
        service: "stun",
        protocol: "udp",
      },
      {
        service: "stuns ",
        protcol: "tcp",
      },
      {
        service: "turn",
        protocol: "tcp",
      },
      {
        service: "turn",
        protocol: "udp",
      },
      {
        service: "turns",
        protcol: "tcp",
      },
    ];
  }

  const family = { options };
  return lookup(domain, options).then((addresses) => {
    return Promise.all(
      options.srv.map((srv) => {
        return resolveSrv(domain, { ...srv, family }).then((records) => {
          return lookupSrvs(records, options);
        });
      }),
    ).then((srvs) => [...sortSrv(srvs.flat()), ...addresses]);
  });
}

module.exports.lookup = lookup;
module.exports.resolveSrv = resolveSrv;
module.exports.lookupSrvs = lookupSrvs;
module.exports.resolve = resolve;
module.exports.sortSrv = sortSrv;
