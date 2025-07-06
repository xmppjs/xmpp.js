import { xml, jid, Client } from "@xmpp/client-core";
import _reconnect from "@xmpp/reconnect";
import _websocket from "@xmpp/websocket";
import _tcp from "@xmpp/tcp";
import _tls from "@xmpp/tls";
import _middleware from "@xmpp/middleware";
import _streamFeatures from "@xmpp/stream-features";
import _iqCaller from "@xmpp/iq/caller.js";
import _iqCallee from "@xmpp/iq/callee.js";
import _resolve from "@xmpp/resolve";
import _starttls from "@xmpp/starttls";
import _sasl2 from "@xmpp/sasl2";
import _sasl from "@xmpp/sasl";
import _resourceBinding from "@xmpp/resource-binding";
import _streamManagement from "@xmpp/stream-management";
import _bind2 from "@xmpp/client-core/src/bind2/bind2.js";
import _fast from "@xmpp/client-core/src/fast/fast.js";
import SASLFactory from "saslmechanisms";
import scramsha1 from "@xmpp/sasl-scram-sha-1";
import plain from "@xmpp/sasl-plain";
import anonymous from "@xmpp/sasl-anonymous";
import htsha256none from "@xmpp/sasl-ht-sha-256-none";

import createOnAuthenticate from "./lib/createOnAuthenticate.js";
import getDomain from "./lib/getDomain.js";

function client(options = {}) {
  let { resource, credentials, username, password, userAgent, ...params } =
    options;

  const { domain, service } = params;
  if (!domain && service) {
    params.domain = getDomain(service);
  }

  const entity = new Client(params);
  if (username && params.domain) {
    entity.jid = jid(username, params.domain);
  }

  const reconnect = _reconnect({ entity });
  const websocket = _websocket({ entity });
  const tcp = setupIfAvailable(_tcp, { entity });
  const tls = setupIfAvailable(_tls, { entity });

  const middleware = _middleware({ entity });
  const streamFeatures = _streamFeatures({ middleware });
  const iqCaller = _iqCaller({ middleware, entity });
  const iqCallee = _iqCallee({ middleware, entity });
  const resolve = _resolve({ entity });

  // SASL mechanisms - order matters and define priority
  const saslFactory = new SASLFactory();
  const mechanisms = Object.entries({
    ...(typeof scramsha1 === "function" && { scramsha1 }),
    plain,
    anonymous,
  }).map(([k, v]) => ({ [k]: v(saslFactory) }));

  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  userAgent ??= xml("user-agent", { id: globalThis.crypto.randomUUID() });

  // Stream features - order matters and define priority
  const starttls = setupIfAvailable(_starttls, { streamFeatures });
  const sasl2 = _sasl2(
    { streamFeatures, saslFactory },
    createOnAuthenticate(credentials ?? { username, password }, userAgent),
  );

  const fast = _fast({
    sasl2,
    entity,
  });
  sasl2.setup({ fast });

  // SASL2 inline features
  const bind2 = _bind2({ sasl2, entity }, resource);

  // FAST mechanisms - order matters and define priority
  htsha256none(fast.saslFactory);

  // Stream features - order matters and define priority
  const sasl = _sasl(
    { streamFeatures, saslFactory },
    createOnAuthenticate(credentials ?? { username, password }, userAgent),
  );
  const streamManagement = _streamManagement({
    streamFeatures,
    entity,
    middleware,
    bind2,
    sasl2,
  });
  const resourceBinding = _resourceBinding(
    { iqCaller, streamFeatures },
    resource,
  );

  iqCallee?.get("urn:xmpp:ping", "ping", () => {
    return {};
  });

  return Object.assign(entity, {
    entity,
    reconnect,
    tcp,
    websocket,
    tls,
    middleware,
    streamFeatures,
    iqCaller,
    iqCallee,
    resolve,
    starttls,
    saslFactory,
    sasl2,
    sasl,
    resourceBinding,
    streamManagement,
    mechanisms,
    bind2,
    fast,
  });
}

// In browsers and react-native some packages are excluded
// see package.json and https://metrobundler.dev/docs/configuration/#resolvermainfields
// in which case the default import returns an empty object
function setupIfAvailable(module, ...args) {
  if (typeof module !== "function") {
    return undefined;
  }

  return module(...args);
}

export { xml, jid, client };
