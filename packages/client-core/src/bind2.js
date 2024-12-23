import xml from "@xmpp/xml";

const NS_BIND = "urn:xmpp:bind:0";

export default function bind2({ sasl2 }) {
  sasl2.use(
    NS_BIND,
    (element) => {
      if (!element.is("bind", NS_BIND)) return;
      return xml(
        "bind",
        { xmlns: "urn:xmpp:bind:0" },
        xml("tag", null, "AwesomeXMPP"),
      );
    },
    (element) => {
      if (element.is("bound", NS_BIND)) {
        console.log("success");
      }
    },
  );
}
