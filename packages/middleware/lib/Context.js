"use strict";

module.exports = class Context {
  constructor(entity, stanza) {
    this.stanza = stanza;
    this.entity = entity;

    const { name, attrs } = stanza;
    const { type, id } = attrs;

    this.name = name;
    this.id = id || "";

    if (name === "message") {
      this.type = type || "normal";
    } else if (name === "presence") {
      this.type = type || "available";
    } else {
      this.type = type || "";
    }

    this.from = null;
    this.to = null;
    this.local = "";
    this.domain = "";
    this.resource = "";
  }
};
