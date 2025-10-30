import dns from "node:dns/promises";

async function lookup(domain, options = {}) {
  options.all = true;
  const addresses = await dns.lookup(domain, options);

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

  return result;
}

const IGNORE_CODES = new Set(["ENOTFOUND", "ENODATA"]);
async function resolveSrv(domain, { service, protocol }) {
  let records;

  try {
    records = await dns.resolveSrv(`_${service}._${protocol}.${domain}`);
  } catch (err) {
    if (IGNORE_CODES.has(err.code)) return [];
  }

  return records.map((record) => {
    return Object.assign(record, { service, protocol });
  });
}

function sortSrv(records) {
  return records.toSorted((a, b) => {
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

async function lookupSrvs(srvs, options) {
  const addresses = [];

  await Promise.all(
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
  );

  return addresses;
}

async function resolve(domain, options = {}) {
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
        service: "stuns",
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

  const addresses = await lookup(domain, options);

  const srvs = await Promise.all(
    options.srv.map(async (srv) => {
      const records = await resolveSrv(domain, { ...srv, family });
      return lookupSrvs(records, options);
    }),
  );

  return [...sortSrv(srvs.flat()), ...addresses];
}

export { lookup, resolveSrv, resolve, lookupSrvs, sortSrv };
