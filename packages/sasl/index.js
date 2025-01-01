import { encode, decode } from "@xmpp/base64";
import SASLError from "./lib/SASLError.js";
import xml from "@xmpp/xml";
import { procedure } from "@xmpp/events";

// https://xmpp.org/rfcs/rfc6120.html#sasl

const NS = "urn:ietf:params:xml:ns:xmpp-sasl";

function getMechanismNames(element) {
  return element.getChildElements().map((el) => el.text());
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
        encode(mech.response(creds)),
      ),
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

      if (element.name === "success") {
        return done();
      }
    },
  );
}

export default function sasl({ streamFeatures, saslFactory }, onAuthenticate) {
  streamFeatures.use("mechanisms", NS, async ({ entity }, _next, element) => {
    const offered = getMechanismNames(element);
    const supported = saslFactory._mechs.map(({ name }) => name);
    const intersection = supported.filter((mech) => offered.includes(mech));

    if (intersection.length === 0) {
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

    await onAuthenticate(done, intersection);

    await entity.restart();
  });
}
