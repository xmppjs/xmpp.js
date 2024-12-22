import { encode, decode } from "@xmpp/base64";
import SASLError from "./lib/SASLError.js";
import xml from "@xmpp/xml";

// https://xmpp.org/rfcs/rfc6120.html#sasl

const NS = "urn:ietf:params:xml:ns:xmpp-sasl";

function getMechanismNames(features) {
  return features
    .getChild("mechanisms", NS)
    .getChildElements()
    .map((el) => el.text());
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

      if (element.name === "failure") {
        reject(SASLError.fromElement(element));
      } else if (element.name === "success") {
        resolve();
      }

      entity.removeListener("nonza", handler);
    };

    entity.on("nonza", handler);

    if (mech.clientFirst) {
      entity.send(
        xml(
          "auth",
          { xmlns: NS, mechanism: mech.name },
          encode(mech.response(creds)),
        ),
      );
    }
  });
}

export default function sasl({ streamFeatures, saslFactory }, onAuthenticate) {
  streamFeatures.use("mechanisms", NS, async ({ stanza, entity }) => {
    const offered = getMechanismNames(stanza);
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
