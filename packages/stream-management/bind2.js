import { NS, makeEnableElement } from "./index.js";

export function setupBind2({ bind2, sm, failed, enabled }) {
  bind2.use(
    NS,
    // https://xmpp.org/extensions/xep-0198.html#inline-examples
    (_element) => {
      return makeEnableElement({ sm });
    },
    async (element) => {
      if (element.is("enabled")) {
        enabled(element.attrs);
      } else if (element.is("failed")) {
        // const error = StreamError.fromElement(element)
        failed();
      }
    },
  );
}
