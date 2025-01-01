import { getAvailableMechanisms } from "@xmpp/sasl";
import xml from "@xmpp/xml";
import SASLFactory from "saslmechanisms";

const NS = "urn:xmpp:fast:0";

export default function fast({ sasl2 }) {
  const saslFactory = new SASLFactory();

  const fast = {
    token: null,
    expiry: null,
    saslFactory,
    mechanisms: [],
    mechanism: null,
    available() {
      return !!(this.token && this.mechanism);
    },
  };

  sasl2.use(
    NS,
    async (element) => {
      if (!element.is("fast", NS)) return;
      fast.mechanisms = getAvailableMechanisms(element, NS, saslFactory);
      fast.mechanism = fast.mechanisms[0];

      if (!fast.mechanism) return;

      if (!fast.token) {
        return xml("request-token", {
          xmlns: NS,
          mechanism: fast.mechanism,
        });
      }

      return xml("fast", { xmlns: NS });
    },
    async (element) => {
      if (element.is("token", NS)) {
        const { token, expiry } = element.attrs;
        fast.token = token;
        fast.expiry = expiry;
      }
    },
  );

  return fast;
}
