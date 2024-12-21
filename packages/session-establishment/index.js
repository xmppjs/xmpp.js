import xml from "@xmpp/xml";

// https://tools.ietf.org/html/draft-cridland-xmpp-session-01

const NS = "urn:ietf:params:xml:ns:xmpp-session";

export default function sessionEstablishment({ iqCaller, streamFeatures }) {
  streamFeatures.use("session", NS, async (context, next, feature) => {
    if (feature.getChild("optional")) return next();
    await iqCaller.set(xml("session", NS));
    return next();
  });
}
