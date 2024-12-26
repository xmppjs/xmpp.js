import { encode, decode } from "@xmpp/base64";
import SASLError from "@xmpp/sasl/lib/SASLError.js";
import xml from "@xmpp/xml";

// https://xmpp.org/extensions/xep-0388.html

const NS = "urn:xmpp:sasl:2";

function getMechanismNames(stanza) {
  return stanza.getChildren("mechanism", NS).map((m) => m.text());
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

  return new Promise((resolve, reject) => {
    const handler = (element) => {
      if (element.getNS() !== NS) {
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

      if (element.name === "failure") {
        reject(SASLError.fromElement(element));
        return;
      }

      if (element.name === "continue") {
        reject(new Error("continue is not supported yet"));
        return;
      }

      if (element.name === "success") {
        const additionalData = element.getChild("additional-data")?.text();
        if (additionalData && mech.final) {
          mech.final(decode(additionalData));
        }

        const aid = element.getChildText("authorization-identifier");
        if (aid) entity._jid(aid);

        for (const child of element.getChildElements()) {
          const feature = features.get(child.getNS());
          if (!feature?.[1]) continue;
          feature?.[1](child);
        }

        resolve(element);
      }

      entity.removeListener("nonza", handler);
    };

    entity.on("nonza", handler);

    entity
      .send(
        xml("authenticate", { xmlns: NS, mechanism: mech.name }, [
          mech.clientFirst &&
            xml("initial-response", {}, encode(mech.response(creds))),
          userAgent,
          ...streamFeatures,
        ]),
      )
      .catch(reject);
  });
}

export default function sasl2({ streamFeatures, saslFactory }, onAuthenticate) {
  const features = new Map();

  streamFeatures.use(
    "authentication",
    NS,
    async ({ entity }, _next, element) => {
      const offered = getMechanismNames(element);
      const supported = saslFactory._mechs.map(({ name }) => name);
      const intersection = supported.filter((mech) => offered.includes(mech));

      if (intersection.length === 0) {
        throw new SASLError("SASL: No compatible mechanism available.");
      }

      const streamFeatures = await getStreamFeatures({ element, features });

      async function done(credentials, mechanism, userAgent) {
        await authenticate({
          saslFactory,
          entity,
          mechanism,
          credentials,
          userAgent,
          streamFeatures,
          features,
        });
      }

      await onAuthenticate(done, intersection);

      return true; // Not online yet, wait for next features
    },
  );

  return {
    use(ns, req, res) {
      features.set(ns, [req, res]);
    },
  };
}

function getStreamFeatures({ element, features }) {
  const promises = [];

  const inline = element.getChild("inline");
  if (!inline) return promises;

  for (const element of inline.getChildElements()) {
    const xmlns = element.getNS();
    const feature = features.get(xmlns);
    if (!feature) continue;
    promises.push(feature[0](element));
  }

  return Promise.all(promises);
}
