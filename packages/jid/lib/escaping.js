"use strict";

module.exports.detect = function detect(local) {
  if (!local) {
    return false;
  }

  // Remove all escaped sequences
  const tmp = local
    .replaceAll(String.raw`\20`, "")
    .replaceAll(String.raw`\22`, "")
    .replaceAll(String.raw`\26`, "")
    .replaceAll(String.raw`\27`, "")
    .replaceAll(String.raw`\2f`, "")
    .replaceAll(String.raw`\3a`, "")
    .replaceAll(String.raw`\3c`, "")
    .replaceAll(String.raw`\3e`, "")
    .replaceAll(String.raw`\40`, "")
    .replaceAll(String.raw`\5c`, "");

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
    .replaceAll(/^\s+|\s+$/g, "")
    .replaceAll("\\", String.raw`\5c`)
    .replaceAll(" ", String.raw`\20`)
    .replaceAll('"', String.raw`\22`)
    .replaceAll("&", String.raw`\26`)
    .replaceAll("'", String.raw`\27`)
    .replaceAll("/", String.raw`\2f`)
    .replaceAll(":", String.raw`\3a`)
    .replaceAll("<", String.raw`\3c`)
    .replaceAll(">", String.raw`\3e`)
    .replaceAll("@", String.raw`\40`);
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
    .replaceAll(String.raw`\20`, " ")
    .replaceAll(String.raw`\22`, '"')
    .replaceAll(String.raw`\26`, "&")
    .replaceAll(String.raw`\27`, "'")
    .replaceAll(String.raw`\2f`, "/")
    .replaceAll(String.raw`\3a`, ":")
    .replaceAll(String.raw`\3c`, "<")
    .replaceAll(String.raw`\3e`, ">")
    .replaceAll(String.raw`\40`, "@")
    .replaceAll(String.raw`\5c`, "\\");
};
