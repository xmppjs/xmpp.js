import { xml, jid, Client } from "@xmpp/client-core";
import getDomain from "./lib/getDomain.js";
import createOnAuthenticate from "./lib/createOnAuthenticate.js";

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
import _sasl from "@xmpp/sasl";
import _resourceBinding from "@xmpp/resource-binding";
import _sessionEstablishment from "@xmpp/session-establishment";
import _streamManagement from "@xmpp/stream-management";

import SASLFactory from "saslmechanisms";
import scramsha1 from "@xmpp/sasl-scram-sha-1";
import plain from "@xmpp/sasl-plain";
import anonymous from "@xmpp/sasl-anonymous";

function client(options = {}) {
  const { resource, credentials, username, password, ...params } = options;

  const { domain, service } = params;
  if (!domain && service) {
    params.domain = getDomain(service);
  }

  const entity = new Client(params);

  const reconnect = _reconnect({ entity });
  const websocket = _websocket({ entity });
  const tcp = _tcp({ entity });
  const tls = _tls({ entity });

  const middleware = _middleware({ entity });
  const streamFeatures = _streamFeatures({ middleware });
  const iqCaller = _iqCaller({ middleware, entity });
  const iqCallee = _iqCallee({ middleware, entity });
  const resolve = _resolve({ entity });

  // SASL mechanisms - order matters and define priority
  const saslFactory = new SASLFactory();
  const mechanisms = Object.entries({
    scramsha1,
    plain,
    anonymous,
  }).map(([k, v]) => ({ [k]: v(saslFactory) }));

  // Stream features - order matters and define priority
  const starttls = _starttls({ streamFeatures });
  const sasl = _sasl(
    { streamFeatures, saslFactory },
    createOnAuthenticate(credentials ?? { username, password }),
  );
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
    sasl,
    resourceBinding,
    sessionEstablishment,
    streamManagement,
    mechanisms,
    saslFactory,
  });
}

export { xml, jid, client };
