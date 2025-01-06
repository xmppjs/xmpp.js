import { EventEmitter } from "@xmpp/events";
import { getAvailableMechanisms } from "@xmpp/sasl";
import xml from "@xmpp/xml";
import SASLFactory from "saslmechanisms";

const NS = "urn:xmpp:fast:0";

export default function fast({ sasl2 }, { saveToken, fetchToken } = {}) {
  const saslFactory = new SASLFactory();

  const fast = new EventEmitter();

  let token;
  saveToken ??= async function saveToken(t) {
    token = t;
  };
  fetchToken ??= async function fetchToken() {
    return token;
  };

  Object.assign(fast, {
    async saveToken() {
      try {
        await saveToken();
      } catch (err) {
        fast.emit("error", err);
      }
    },
    async fetchToken() {
      try {
        return await fetchToken();
      } catch (err) {
        fast.emit("error", err);
      }
    },
    saslFactory,
    async auth({
      authenticate,
      entity,
      userAgent,
      token,
      credentials,
      streamFeatures,
      features,
    }) {
      try {
        await authenticate({
          saslFactory: fast.saslFactory,
          mechanism: token.mechanism,
          credentials: {
            ...credentials,
            password: token.token,
          },
          streamFeatures: [
            ...streamFeatures,
            xml("fast", {
              xmlns: NS,
            }),
          ],
          entity,
          userAgent,
          features,
        });
        return true;
      } catch (err) {
        fast.emit("error", err);
        return false;
      }
    },
    _requestToken(streamFeatures) {
      streamFeatures.push(
        xml("request-token", {
          xmlns: NS,
          mechanism: fast.mechanism,
        }),
      );
    },
  });

  function reset() {
    fast.mechanism = null;
  }
  reset();

  sasl2.use(
    NS,
    async (element) => {
      if (!element.is("fast", NS)) return reset();

      fast.available = true;

      const mechanisms = getAvailableMechanisms(element, NS, saslFactory);
      const mechanism = mechanisms[0];

      if (!mechanism) return reset();
      fast.mechanism = mechanism;

      // The rest is handled by @xmpp/sasl2
    },
    async (element) => {
      if (element.is("token", NS)) {
        try {
          await saveToken({
            mechanism: fast.mechanism,
            token: element.attrs.token,
            expiry: element.attrs.expiry,
          });
        } catch (err) {
          fast.emit("error", err);
        }
      }
    },
  );

  return fast;
}
