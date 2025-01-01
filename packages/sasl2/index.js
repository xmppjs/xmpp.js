import { encode, decode } from "@xmpp/base64";
import SASLError from "@xmpp/sasl/lib/SASLError.js";
import xml from "@xmpp/xml";
import { procedure } from "@xmpp/events";

// https://xmpp.org/extensions/xep-0388.html

const NS = "urn:xmpp:sasl:2";

export function getAvailableMechanisms(element, NS, saslFactory) {
  const offered = new Set(
    element.getChildren("mechanism", NS).map((m) => m.text()),
  );
  const supported = saslFactory._mechs.map(({ name }) => name);
  return supported.filter((mech) => offered.has(mech));
}

async function authenticate({
  saslFactory,
  entity,
  mechanism,
  credentials,
  userAgent,
  streamFeatures,
  features,
}) {
  const mech = saslFactory.create([mechanism]);
  if (!mech) {
    throw new Error(`SASL: Mechanism ${mechanism} not found.`);
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

  await procedure(
    entity,
    xml("authenticate", { xmlns: NS, mechanism: mech.name }, [
      mech.clientFirst &&
        xml("initial-response", {}, encode(mech.response(creds))),
      userAgent,
      ...streamFeatures,
    ]),
    async (element, done) => {
      if (element.getNS() !== NS) return;

      if (element.name === "challenge") {
        mech.challenge(decode(element.text()));
        const resp = mech.response(creds);
        await entity.send(
          xml(
            "response",
            { xmlns: NS, mechanism: mech.name },
            typeof resp === "string" ? encode(resp) : "",
          ),
        );
        return;
      }

      if (element.name === "failure") {
        throw SASLError.fromElement(element);
      }

      if (element.name === "continue") {
        throw new Error("SASL continue is not supported yet");
      }

      if (element.name === "success") {
        const additionalData = element.getChild("additional-data")?.text();
        if (additionalData && mech.final) {
          mech.final(decode(additionalData));
        }

        // https://xmpp.org/extensions/xep-0388.html#success
        // this is a bare JID, unless resource binding or stream resumption has occurred, in which case it is a full JID.
        const aid = element.getChildText("authorization-identifier");
        if (aid) {
          entity._jid(aid);
        }

        for (const child of element.getChildElements()) {
          const feature = features.get(child.getNS());
          feature?.[1]?.(child);
        }

        return done();
      }
    },
  );
}

export default function sasl2({ streamFeatures, saslFactory }, onAuthenticate) {
  const features = new Map();
  let fast;

  streamFeatures.use(
    "authentication",
    NS,
    async ({ entity }, _next, element) => {
      const streamFeatures = await getStreamFeatures({ element, features });

      const fastStreamFeature = [...streamFeatures].find((el) =>
        el?.is("fast", "urn:xmpp:fast:0"),
      );
      const is_fast = fastStreamFeature && fast;

      async function done(credentials, mechanism, userAgent) {
        const params = {
          entity,
          credentials,
          userAgent,
          streamFeatures,
          features,
        };

        if (is_fast) {
          try {
            await authenticate({
              saslFactory: fast.saslFactory,
              mechanism: fast.mechanisms[0],
              ...params,
            });
            return;
          } catch {
            // If fast authentication fails, continue and try with sasl
            streamFeatures.delete(fastStreamFeature);
          }
        }

        await authenticate({
          saslFactory,
          mechanism,
          ...params,
        });
      }

      const mechanisms = getAvailableMechanisms(element, NS, saslFactory);
      if (mechanisms.length === 0) {
        throw new SASLError("SASL: No compatible mechanism available.");
      }

      await onAuthenticate(done, mechanisms, is_fast && fast);
    },
  );

  return {
    use(ns, req, res) {
      features.set(ns, [req, res]);
    },
    setup({ fast: _fast }) {
      fast = _fast;
    },
  };
}

async function getStreamFeatures({ element, features }) {
  const promises = [];

  const inline = element.getChild("inline");
  if (!inline) return promises;

  for (const element of inline.getChildElements()) {
    const xmlns = element.getNS();
    const feature = features.get(xmlns);
    if (!feature) continue;
    promises.push(feature[0](element));
  }

  return new Set(await Promise.all(promises));
}
