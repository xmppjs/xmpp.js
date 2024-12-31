import xml from "@xmpp/xml";
import SASLFactory from "saslmechanisms";
import { getAvailableMechanisms } from "@xmpp/sasl2";

const NS_FAST = "urn:xmpp:fast:0";

export default function fast({ sasl2 }, onAuthenticate) {
  const saslFactory = new SASLFactory();

  const fast = {
    token: null,
    expiry: null,
    count: 0,
    saslFactory,
    mechanisms: [],
  };

  sasl2.use(
    NS_FAST,
    async (element) => {
      if (!element.is("fast", NS_FAST)) return;
      fast.mechanisms = getAvailableMechanisms();

      if (fast.mechanisms.length === 0) return;

      if (!fast.token) {
        return xml("request-token", {
          xmlns: NS_FAST,
          mechanism: "HT-SHA-256-NONE",
        });
      }

      return xml("fast", { xmlns: "urn:xmpp:fast:0", count: ++fast.count });
    },
    (element) => {
      if (element.is("token")) {
        fast.token = element.attrs.token;
        fast.expiry = element.attrs.expiry;
        fast.count = 0;
      }
    },
  );

  return fast;
}
