import JID from "./lib/JID.js";
import { detect, escape, unescape } from "./lib/escaping.js";
import parse from "./lib/parse.js";

export function equal(a, b) {
  return a.equals(b);
}

function jid(...args) {
  if (!args[1] && !args[2]) {
    return parse(...args);
  }

  return new JID(...args);
}

const j = jid.bind();
j.jid = jid;
j.JID = JID;
j.parse = parse;
j.equal = equal;
j.detectEscape = detect;
j.escapeLocal = escape;
j.unescapeLocal = unescape;

export default j;

export { jid, JID, parse };

export {
  detect as detectEscape,
  escape as escapeLocal,
  unescape as unescapeLocal,
};
