const ANONYMOUS = "ANONYMOUS";
const PLAIN = "PLAIN";

export default function createOnAuthenticate(credentials, userAgent) {
  return async function onAuthenticate(...args) {
    if (typeof credentials === "function") {
      await credentials(...args);
      return;
    }

    const [authenticate, mechanisms, fast, entity] = args;

    credentials.token ??= await fast?.fetch();

    const mechanism = getMechanism({ mechanisms, entity, credentials });
    await authenticate(credentials, mechanism, userAgent);
  };
}

export function getMechanism({ mechanisms, entity, credentials }) {
  if (
    !credentials?.username &&
    !credentials?.password &&
    !credentials?.token &&
    mechanisms.includes(ANONYMOUS)
  ) {
    return ANONYMOUS;
  }

  if (entity.isSecure()) return mechanisms[0];

  return mechanisms.find((mechanism) => mechanism !== PLAIN);
}
