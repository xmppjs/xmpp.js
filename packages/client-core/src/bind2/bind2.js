import xml from "@xmpp/xml";

const NS_BIND = "urn:xmpp:bind:0";

export default function bind2({ sasl2 }, tag) {
  sasl2.use(NS_BIND, async (element) => {
    if (!element.is("bind", NS_BIND)) return;

    tag = typeof tag === "function" ? await tag() : tag;

    return xml(
      "bind",
      { xmlns: "urn:xmpp:bind:0" },
      tag && xml("tag", null, tag),
    );
  });
}
