"use strict";

const JID = require("../lib/JID");

module.exports = function parse(s) {
  let local;
  let resource;

  const resourceStart = s.indexOf("/");
  if (resourceStart !== -1) {
    resource = s.slice(resourceStart + 1);
    s = s.slice(0, resourceStart);
  }

  const atStart = s.indexOf("@");
  if (atStart !== -1) {
    local = s.slice(0, atStart);
    s = s.slice(atStart + 1);
  }

  return new JID(local, s, resource);
};
