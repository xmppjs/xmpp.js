import { encode, decode } from "@xmpp/base64";
import xml from "@xmpp/xml";
import { procedure } from "@xmpp/events";

import SASLError from "./lib/SASLError.js";

// https://xmpp.org/rfcs/rfc6120.html#sasl

const NS = "urn:ietf:params:xml:ns:xmpp-sasl";

export function getAvailableMechanisms(element, NS, saslFactory) {
  const offered = new Set(
    element.getChildren("mechanism", NS).map((m) => m.text()),
  );
  const supported = saslFactory._mechs.map(({ name }) => name);
  return supported.filter((mech) => offered.has(mech));
}

async function authenticate({ saslFactory, entity, mechanism, credentials }) {
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
    mech.clientFirst &&
      xml(
        "auth",
        { xmlns: NS, mechanism: mech.name },
        encode(await mech.response(creds)),
      ),
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

      if (element.name === "success") {
        return done();
      }
    },
  );
}

export default function sasl({ streamFeatures, saslFactory }, onAuthenticate) {
  streamFeatures.use("mechanisms", NS, async ({ entity }, _next, element) => {
    const mechanisms = getAvailableMechanisms(element, NS, saslFactory);
    if (mechanisms.length === 0) {
      throw new SASLError("SASL: No compatible mechanism available.");
    }

    async function done(credentials, mechanism) {
      await authenticate({
        saslFactory,
        entity,
        mechanism,
        credentials,
      });
    }

    await onAuthenticate(done, mechanisms, null, entity);

    await entity.restart();
  });
}
