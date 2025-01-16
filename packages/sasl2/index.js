import { encode, decode } from "@xmpp/base64";
import SASLError from "@xmpp/sasl/lib/SASLError.js";
import xml from "@xmpp/xml";
import { procedure } from "@xmpp/events";
import { getAvailableMechanisms } from "@xmpp/sasl";

// https://xmpp.org/extensions/xep-0388.html

const NS = "urn:xmpp:sasl:2";

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
        xml("initial-response", {}, encode(await mech.response(creds))),
      userAgent,
      ...streamFeatures,
    ]),
    async (element, done) => {
      if (element.getNS() !== NS) return;

      if (element.name === "challenge") {
        await mech.challenge(decode(element.text()));
        const resp = await mech.response(creds);
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
          await mech.final(decode(additionalData));
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
      const mechanisms = getAvailableMechanisms(element, NS, saslFactory);
      const streamFeatures = await getStreamFeatures({ element, features });
      const fast_available = !!fast?.mechanism;

      if (mechanisms.length === 0 && !fast_available) {
        throw new SASLError("SASL: No compatible mechanism available.");
      }

      await onAuthenticate(
        done,
        mechanisms,
        fast_available ? fast : null,
        entity,
      );

      async function done(credentials, mechanism, userAgent) {
        // Try fast
        const success = await fast.auth({
          authenticate,
          entity,
          userAgent,
          streamFeatures,
          features,
          credentials,
        });
        if (success) return;

        // fast.auth may mutate streamFeatures to request a token

        // If fast authentication fails, continue and try without
        await authenticate({
          entity,
          userAgent,
          streamFeatures,
          features,
          saslFactory,
          mechanism,
          credentials,
        });
      }
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

  return Promise.all(promises);
}
