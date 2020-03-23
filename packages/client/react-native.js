"use strict";

const { xml, jid, Client } = require("@xmpp/client-core");
const getDomain = require("./lib/getDomain");

const _reconnect = require("@xmpp/reconnect");
const _websocket = require("@xmpp/websocket");
const _middleware = require("@xmpp/middleware");
const _streamFeatures = require("@xmpp/stream-features");
const _iqCaller = require("@xmpp/iq/caller");
const _iqCallee = require("@xmpp/iq/callee");
const _resolve = require("@xmpp/resolve");

// Stream features - order matters and define priority
const _sasl = require("@xmpp/sasl");
const _resourceBinding = require("@xmpp/resource-binding");
const _sessionEstablishment = require("@xmpp/session-establishment");
const _streamManagement = require("@xmpp/stream-management");

// SASL mechanisms - order matters and define priority
const anonymous = require("@xmpp/sasl-anonymous");
const plain = require("@xmpp/sasl-plain");

function client(options = {}) {
  const { resource, credentials, username, password, ...params } = options;

  const { domain, service } = params;
  if (!domain && service) {
    params.domain = getDomain(service);
  }

  const entity = new Client(params);

  const reconnect = _reconnect({ entity });
  const websocket = _websocket({ entity });

  const middleware = _middleware({ entity });
  const streamFeatures = _streamFeatures({ middleware });
  const iqCaller = _iqCaller({ middleware, entity });
  const iqCallee = _iqCallee({ middleware, entity });
  const resolve = _resolve({ entity });
  // Stream features - order matters and define priority
  const sasl = _sasl({ streamFeatures }, credentials || { username, password });
  const streamManagement = _streamManagement({
    streamFeatures,
    entity,
    middleware,
  });
  const resourceBinding = _resourceBinding(
    { iqCaller, streamFeatures },
    resource,
  );
  const sessionEstablishment = _sessionEstablishment({
    iqCaller,
    streamFeatures,
  });
  // SASL mechanisms - order matters and define priority
  const mechanisms = Object.entries({ plain, anonymous }).map(([k, v]) => ({
    [k]: v(sasl),
  }));

  return Object.assign(entity, {
    entity,
    reconnect,
    websocket,
    middleware,
    streamFeatures,
    iqCaller,
    iqCallee,
    resolve,
    sasl,
    resourceBinding,
    sessionEstablishment,
    streamManagement,
    mechanisms,
  });
}

module.exports.xml = xml;
module.exports.jid = jid;
module.exports.client = client;
