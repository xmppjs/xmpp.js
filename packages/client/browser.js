import { xml, jid, Client } from "@xmpp/client-core";
import getDomain from "./lib/getDomain.js";

import _reconnect from "@xmpp/reconnect";
import _websocket from "@xmpp/websocket";
import _middleware from "@xmpp/middleware";
import _streamFeatures from "@xmpp/stream-features";
import _iqCaller from "@xmpp/iq/caller.js";
import _iqCallee from "@xmpp/iq/callee.js";
import _resolve from "@xmpp/resolve";
import _sasl2 from "@xmpp/sasl2";
import _sasl from "@xmpp/sasl";
import _resourceBinding from "@xmpp/resource-binding";
import _sessionEstablishment from "@xmpp/session-establishment";
import _streamManagement from "@xmpp/stream-management";

import plain from "@xmpp/sasl-plain";
import anonymous from "@xmpp/sasl-anonymous";

function client(options = {}) {
  const {
    resource,
    credentials,
    username,
    password,
    clientId,
    software,
    device,
    ...params
  } = options;

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
  const sasl2 = _sasl2(
    { streamFeatures },
    credentials || { username, password },
    { clientId, software, device },
  );
  const sasl = _sasl({ streamFeatures }, credentials || { username, password });
  const streamManagement = _streamManagement({
    streamFeatures,
    entity,
    middleware,
    sasl2,
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
  const mechanisms = Object.entries({
    plain,
    anonymous,
  }).map(([k, v]) => ({ [k]: [v(sasl2), v(sasl)] }));

  return Object.assign(entity, {
    entity,
    reconnect,
    websocket,
    middleware,
    streamFeatures,
    iqCaller,
    iqCallee,
    resolve,
    sasl2,
    sasl,
    resourceBinding,
    sessionEstablishment,
    streamManagement,
    mechanisms,
  });
}

export { xml, jid, client };
