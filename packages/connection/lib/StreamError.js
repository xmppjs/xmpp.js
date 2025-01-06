import XMPPError from "@xmpp/error";

// https://xmpp.org/rfcs/rfc6120.html#streams-error

class StreamError extends XMPPError {
  constructor(...args) {
    super(...args);
    this.name = "StreamError";
  }
}

export default StreamError;
