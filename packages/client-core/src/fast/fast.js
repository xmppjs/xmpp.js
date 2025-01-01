import { getAvailableMechanisms } from "@xmpp/sasl2";
import xml from "@xmpp/xml";
import SASLFactory from "saslmechanisms";

const NS = "urn:xmpp:fast:0";

export default function fast({ sasl2 }) {
  const saslFactory = new SASLFactory();

  const fast = {
    token: null,
    expiry: null,
    count: 0,
    saslFactory,
    mechanisms: [],
  };

  sasl2.use(
    NS,
    async (element) => {
      if (!element.is("fast", NS)) return;
      fast.mechanisms = getAvailableMechanisms(element, NS, saslFactory);

      if (fast.mechanisms.length === 0) return;

      if (!fast.token) {
        return xml("request-token", {
          xmlns: NS,
          mechanism: "HT-SHA-256-NONE",
        });
      }

      return xml("fast", { xmlns: NS, count: fast.count++ });
    },
    (element) => {
      if (element.is("token", NS)) {
        fast.token = element.attrs.token;
        fast.expiry = element.attrs.expiry;
        fast.count = 0;
      }
    },
  );

  return fast;
}
