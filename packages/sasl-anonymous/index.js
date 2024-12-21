import mech from "sasl-anonymous";

/**
 * [XEP-0175: Best Practices for Use of SASL ANONYMOUS](https://xmpp.org/extensions/xep-0175.html)
 * [RFC-4504: Anonymous Simple Authentication and Security Layer (SASL) Mechanism](https://tools.ietf.org/html/rfc4505)
 */

export default function saslAnonymous(sasl) {
  sasl.use(mech);
}
