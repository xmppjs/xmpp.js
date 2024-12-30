import xml from "@xmpp/xml";

const NS_FAST = "urn:xmpp:fast:0";

export default function fast({ sasl2 }) {
  let token = null;
  let count = 0;

  sasl2.use(
    NS_FAST,
    async (element, nonza_authenticate) => {
      if (!element.is("fast", NS_FAST)) return;

      if (!token) {
        return xml("request-token", {
          xmlns: NS_FAST,
          mechanism: "HT-SHA-256-NONE",
        });
      }

      nonza_authenticate.attrs.mechanism = "HT-SHA-256-NONE";

      return xml("fast", { xmlns: "urn:xmpp:fast:0", count });
    },
    (element) => {
      if (element.is("token")) {
        token = element;
        count = 0;
      }
    },
  );
}
