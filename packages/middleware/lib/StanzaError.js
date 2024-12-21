import XMPPError from "@xmpp/error";

/* https://xmpp.org/rfcs/rfc6120.html#stanzas-error */

class StanzaError extends XMPPError {
  constructor(condition, text, application, type) {
    super(condition, text, application);
    this.type = type;
    this.name = "StanzaError";
  }

  static fromElement(element) {
    const error = super.fromElement(element);
    error.type = element.attrs.type;
    return error;
  }
}

export default StanzaError;
