"use strict";

module.exports.detect = function detect(local) {
  if (!local) {
    return false;
  }

  // Remove all escaped sequences
  const tmp = local
    .replace(/\\20/g, "")
    .replace(/\\22/g, "")
    .replace(/\\26/g, "")
    .replace(/\\27/g, "")
    .replace(/\\2f/g, "")
    .replace(/\\3a/g, "")
    .replace(/\\3c/g, "")
    .replace(/\\3e/g, "")
    .replace(/\\40/g, "")
    .replace(/\\5c/g, "");

  // Detect if we have unescaped sequences
  const search = tmp.search(/[ "&'/:<>@\\]/g);
  if (search === -1) {
    return false;
  }

  return true;
};

/**
 * Escape the local part of a JID.
 *
 * @see http://xmpp.org/extensions/xep-0106.html
 * @param String local local part of a jid
 * @return An escaped local part
 */
module.exports.escape = function escape(local) {
  if (local === null) {
    return null;
  }

  return local
    .replace(/^\s+|\s+$/g, "")
    .replace(/\\/g, "\\5c")
    .replace(/ /g, "\\20")
    .replace(/"/g, "\\22")
    .replace(/&/g, "\\26")
    .replace(/'/g, "\\27")
    .replace(/\//g, "\\2f")
    .replace(/:/g, "\\3a")
    .replace(/</g, "\\3c")
    .replace(/>/g, "\\3e")
    .replace(/@/g, "\\40");
};

/**
 * Unescape a local part of a JID.
 *
 * @see http://xmpp.org/extensions/xep-0106.html
 * @param String local local part of a jid
 * @return unescaped local part
 */
module.exports.unescape = function unescape(local) {
  if (local === null) {
    return null;
  }

  return local
    .replace(/\\20/g, " ")
    .replace(/\\22/g, '"')
    .replace(/\\26/g, "&")
    .replace(/\\27/g, "'")
    .replace(/\\2f/g, "/")
    .replace(/\\3a/g, ":")
    .replace(/\\3c/g, "<")
    .replace(/\\3e/g, ">")
    .replace(/\\40/g, "@")
    .replace(/\\5c/g, "\\");
};
