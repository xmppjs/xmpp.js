import { NS, makeResumeElement } from "./index.js";

export function setupSasl2({ sasl2, sm, failed, resumed }) {
  sasl2.use(
    NS,
    (element) => {
      if (!element.is("sm")) return;
      if (sm.id) return makeResumeElement({ sm });
    },
    (element) => {
      if (element.is("resumed")) {
        resumed(element);
      } else if (element.is("failed")) {
        // const error = StreamError.fromElement(element)
        failed();
      }
    },
  );
}
