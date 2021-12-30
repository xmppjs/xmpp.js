"use strict";

const resolve = require("./resolve");
const { promise } = require("@xmpp/events");

async function fetchURIs(domain) {
  const result = await resolve(domain, {
    srv: [
      {
        service: "xmpps-client",
        protocol: "tcp",
      },
      {
        service: "xmpp-client",
        protocol: "tcp",
      },
    ],
  });

  return [
    // Remove duplicates
    ...new Set(result.map((record) => record.uri)),
  ];
}

function filterSupportedURIs(entity, uris) {
  return uris.filter((uri) => entity._findTransport(uri));
}

async function fallbackConnect(entity, uris) {
  if (uris.length === 0) {
    throw new Error("Couldn't connect");
  }

  const uri = uris.shift();
  const Transport = entity._findTransport(uri);

  if (!Transport) {
    return fallbackConnect(entity, uris);
  }

  entity._status("connecting", uri);
  const params = Transport.prototype.socketParameters(uri);
  const socket = new Transport.prototype.Socket();

  try {
    socket.connect(params);
    await promise(socket, "connect");
  } catch {
    return fallbackConnect(entity, uris);
  }

  entity._attachSocket(socket);
  socket.emit("connect");
  entity.Transport = Transport;
  entity.Socket = Transport.prototype.Socket;
  entity.Parser = Transport.prototype.Parser;
}

module.exports = function resolve({ entity }) {
  const _connect = entity.connect;
  entity.connect = async function connect(service) {
    if (!service || /:\/\//.test(service)) {
      return _connect.call(this, service);
    }

    const uris = filterSupportedURIs(entity, await fetchURIs(service));

    if (uris.length === 0) {
      throw new Error("No compatible transport found.");
    }

    try {
      await fallbackConnect(entity, uris);
    } catch (err) {
      entity._reset();
      entity._status("disconnect");
      throw err;
    }
  };
};
