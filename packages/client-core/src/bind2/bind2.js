import xml from "@xmpp/xml";

const NS = "urn:xmpp:bind:0";

export default function bind2({ sasl2, entity }, tag) {
  const features = new Map();

  sasl2.use(
    NS,
    async (element) => {
      if (!element.is("bind", NS)) return;

      tag = typeof tag === "function" ? await tag() : tag;

      const sessionFeatures = await getSessionFeatures({ element, features });

      return xml(
        "bind",
        { xmlns: "urn:xmpp:bind:0" },
        tag && xml("tag", null, tag),
        ...sessionFeatures,
      );
    },
    (element) => {
      if (!element.is("bound")) return;
      entity._ready(false);
      for (const child of element.getChildElements()) {
        const feature = features.get(child.getNS());
        feature?.[1]?.(child);
      }
    },
  );

  return {
    use(ns, req, res) {
      features.set(ns, [req, res]);
    },
  };
}

function getSessionFeatures({ element, features }) {
  const promises = [];

  const inline = element.getChild("inline");
  if (!inline) return promises;

  for (const element of inline.getChildElements()) {
    const xmlns = element.attrs.var;
    const feature = features.get(xmlns);
    if (!feature) continue;
    promises.push(feature[0](element));
  }

  return Promise.all(promises);
}
