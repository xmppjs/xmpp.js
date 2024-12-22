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

async function authenticate(saslFactory, entity, mechname, credentials) {
  const mech = saslFactory.create([mechname]);
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

export default function sasl({ streamFeatures, saslFactory }, credentials) {
  streamFeatures.use("mechanisms", NS, async ({ stanza, entity }) => {
    const offered = getMechanismNames(stanza);
    const supported = saslFactory._mechs.map(({ name }) => name);
    // eslint-disable-next-line unicorn/prefer-array-find
    const intersection = supported.filter((mech) => {
      return offered.includes(mech);
    });
    let mech = intersection[0];

    if (typeof credentials === "function") {
      await credentials(
        (creds) => authenticate(saslFactory, entity, mech, creds, stanza),
        mech,
      );
    } else {
      if (!credentials.username && !credentials.password) {
        mech = "ANONYMOUS";
      }

      await authenticate(saslFactory, entity, mech, credentials, stanza);
    }

    await entity.restart();
  });

  return {};
}
