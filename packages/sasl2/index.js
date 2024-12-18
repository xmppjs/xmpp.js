"use strict";

const { encode, decode } = require("@xmpp/base64");
const SASLError = require("./lib/SASLError");
const jid = require("@xmpp/jid");
const xml = require("@xmpp/xml");
const SASLFactory = require("saslmechanisms");

// https://xmpp.org/extensions/xep-0388.html
// https://xmpp.org/extensions/xep-0386.html
// https://xmpp.org/extensions/xep-0484.html

const NS = "urn:xmpp:sasl:2";
const BIND2_NS = "urn:xmpp:bind:0";
const FAST_NS = "urn:xmpp:fast:0";

async function authenticate(
  SASL,
  inlineHandlers,
  bindInlineHandlers,
  entity,
  mechname,
  credentials,
  userAgent,
  features,
) {
  const mech = SASL.create([mechname]);
  if (!mech) {
    throw new Error("No compatible mechanism");
  }

  const { domain } = entity.options;
  const creds = {
    username: null,
    password: null,
    server: domain,
    host: domain,
    realm: domain,
    serviceType: "xmpp",
    serviceName: domain,
    ...credentials,
  };

  const promise = new Promise((resolve, reject) => {
    const handler = (element) => {
      if (element.attrs.xmlns !== NS) {
        return;
      }

      if (element.name === "challenge") {
        mech.challenge(decode(element.text()));
        const resp = mech.response(creds);
        entity.send(
          xml(
            "response",
            { xmlns: NS, mechanism: mech.name },
            typeof resp === "string" ? encode(resp) : "",
          ),
        );
        return;
      }

      switch (element.name) {
        case "failure": {
          reject(SASLError.fromElement(element));
          break;
        }
        case "continue": {
          // No tasks supported yet
          reject();
          break;
        }
        case "success": {
          const additionalData = element.getChild("additional-data")?.text();
          if (additionalData && mech.final) {
            mech.final(decode(additionalData));
          }
          // This jid will be bare unless we do inline bind2 then it will be the bound full jid
          const aid = element.getChild("authorization-identifier")?.text();
          if (aid) {
            if (!entity.jid?.resource) {
              // No jid or bare jid, so update it
              entity._jid(aid);
            } else if (jid(aid).resource) {
              // We have a full jid so use it
              entity._jid(aid);
            }
          }
          const token = element.getChild("token", FAST_NS);
          if (token) {
            entity.emit("fast-token", token);
          }
          resolve(element);
          break;
        }
      }

      entity.removeListener("nonza", handler);
    };

    entity.on("nonza", handler);
  });

  const sendInline = [];
  const hPromises = [];
  const inline = features.getChild("authentication", NS).getChild("inline");
  for (const el of inline?.children || []) {
    const h = inlineHandlers["{" + el.attrs.xmlns + "}" + el.name];
    if (h) {
      hPromises.push(
        h(el, (addEl) => {
          sendInline.push(addEl);
          return promise;
        }),
      );
    }
  }

  const bindInline = [];
  const bind2 = inline?.getChild("bind", BIND2_NS);
  for (const el of bind2?.getChild("inline")?.getChildren("feature") || []) {
    const h = bindInlineHandlers[el.attrs.var];
    if (h) {
      hPromises.push(
        h((addEl) => {
          bindInline.push(addEl);
          return promise;
        }),
      );
    }
  }

  entity.send(
    xml("authenticate", { xmlns: NS, mechanism: mech.name }, [
      mech.clientFirst &&
        xml("initial-response", {}, encode(mech.response(creds))),
      (userAgent?.clientId || userAgent?.software || userAgent?.device) &&
        xml(
          "user-agent",
          userAgent.clientId ? { id: userAgent.clientId } : {},
          [
            userAgent.software && xml("software", {}, userAgent.software),
            userAgent.device && xml("device", {}, userAgent.device),
          ],
        ),
      bind2 != null &&
        userAgent?.clientId &&
        xml("bind", { xmlns: BIND2_NS }, [
          userAgent?.software && xml("tag", {}, userAgent.software),
          ...bindInline,
        ]),
      credentials.requestToken &&
        xml(
          "request-token",
          { xmlns: FAST_NS, mechanism: credentials.requestToken },
          [],
        ),
      (credentials.fastCount || credentials.fastCount === 0) &&
        xml("fast", { xmlns: FAST_NS, count: credentials.fastCount }, []),
      ...sendInline,
    ]),
  );

  await Promise.all([promise, ...hPromises]);
}

module.exports = function sasl2({ streamFeatures }, credentials, userAgent) {
  const SASL = new SASLFactory();
  const handlers = {};
  const bindHandlers = {};

  streamFeatures.use("authentication", NS, async ({ stanza, entity }) => {
    const offered = new Set(
      stanza
        .getChild("authentication", NS)
        .getChildren("mechanism", NS)
        .map((m) => m.text()),
    );
    const fast = new Set(
      stanza
        .getChild("authentication", NS)
        .getChild("inline")
        ?.getChild("fast", FAST_NS)
        ?.getChildren("mechanism", FAST_NS)
        ?.map((m) => m.text()) || [],
    );
    const supported = SASL._mechs.map(({ name }) => name);

    const intersection = supported
      .map((mech) => ({
        name: mech,
        canFast: fast.has(mech),
        canOther: offered.has(mech),
      }))
      .filter((mech) => mech.canFast || mech.canOther);

    if (typeof credentials === "function") {
      await credentials(
        (creds, mech) =>
          authenticate(
            SASL,
            handlers,
            bindHandlers,
            entity,
            mech,
            creds,
            userAgent,
            stanza,
          ),
        intersection,
      );
    } else {
      let mech = intersection[0]?.name;
      if (!credentials.username && !credentials.password) {
        mech = "ANONYMOUS";
      }

      await authenticate(
        SASL,
        handlers,
        bindHandlers,
        entity,
        mech,
        credentials,
        userAgent,
        stanza,
      );
    }

    return true; // Not online yet, wait for next features
  });

  return {
    use(...args) {
      return SASL.use(...args);
    },
    inline(name, xmlns, handler) {
      handlers["{" + xmlns + "}" + name] = handler;
    },
    bindInline(feature, handler) {
      bindHandlers[feature] = handler;
    },
  };
};
