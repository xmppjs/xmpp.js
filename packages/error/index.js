"use strict";

// https://xmpp.org/rfcs/rfc6120.html#rfc.section.4.9.2

class XMPPError extends Error {
  constructor(condition, text, application) {
    super(condition + (text ? ` - ${text}` : ""));
    this.name = "XMPPError";
    this.condition = condition;
    this.text = text;
    this.application = application;
  }

  static fromElement(element) {
    const [condition, second, third] = element.getChildElements();
    let text;
    let application;

    if (second) {
      if (second.is("text")) {
        text = second;
      } else if (second) {
        application = second;
      }

      if (third) application = third;
    }

    const error = new this(
      condition.name,
      text ? text.text() : "",
      application,
    );
    error.element = element;
    return error;
  }
}

module.exports = XMPPError;
