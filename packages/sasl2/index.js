"use strict";

const { encode, decode } = require("@xmpp/base64");
const SASLError = require("./lib/SASLError");
var jid = require("@xmpp/jid");
const xml = require("@xmpp/xml");
const SASLFactory = require("saslmechanisms");

// https://xmpp.org/rfcs/rfc6120.html#sasl

const NS = "urn:xmpp:sasl:2";
const BIND2_NS = "urn:xmpp:bind:0";
const FAST_NS = "urn:xmpp:fast:0";

async function authenticate(
  SASL,
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

  return new Promise((resolve, reject) => {
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
        case "failure":
          reject(SASLError.fromElement(element));
          break;
        case "continue":
          // No tasks supported yet
          reject();
          break;
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
          resolve();
          break;
        }
      }

      entity.removeListener("nonza", handler);
    };

    entity.on("nonza", handler);

    const bind2 = features
      .getChild("authentication", NS)
      .getChild("inline")
      ?.getChild("bind", BIND2_NS);

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
          ]),
        credentials.requestToken &&
          xml(
            "request-token",
            { xmlns: FAST_NS, mechanism: credentials.requestToken },
            [],
          ),
        (credentials.fastCount || credentials.fastCount === 0) &&
          xml("fast", { xmlns: FAST_NS, count: credentials.fastCount }, []),
      ]),
    );
  });
}

module.exports = function sasl({ streamFeatures }, credentials, userAgent) {
  const SASL = new SASLFactory();

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
    // eslint-disable-next-line unicorn/prefer-array-find
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
          authenticate(SASL, entity, mech, creds, userAgent, stanza),
        intersection,
      );
    } else {
      let mech = intersection[0]?.name;
      if (!credentials.username && !credentials.password) {
        mech = "ANONYMOUS";
      }

      await authenticate(SASL, entity, mech, credentials, userAgent, stanza);
    }

    return true; // Not online yet, wait for next features
  });

  return {
    use(...args) {
      return SASL.use(...args);
    },
  };
};
