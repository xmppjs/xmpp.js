import { Component, xml, jid } from "@xmpp/component-core";
import _reconnect from "@xmpp/reconnect";
import _middleware from "@xmpp/middleware";
import _iqCaller from "@xmpp/iq/caller.js";
import _iqCallee from "@xmpp/iq/callee.js";

function component(options) {
  const { password, service, domain } = options;

  const entity = new Component({ service, domain });

  const reconnect = _reconnect({ entity });
  const middleware = _middleware({ entity });
  const iqCaller = _iqCaller({ entity, middleware });
  const iqCallee = _iqCallee({ entity, middleware });

  entity.on("open", async (el) => {
    try {
      const { id } = el.attrs;
      await (typeof password === "function"
        ? password((creds) => entity.authenticate(id, creds))
        : entity.authenticate(id, password));
    } catch (err) {
      entity.emit("error", err);
    }
  });

  return Object.assign(entity, {
    entity,
    reconnect,
    middleware,
    iqCaller,
    iqCallee,
  });
}

export { xml, jid, component };
