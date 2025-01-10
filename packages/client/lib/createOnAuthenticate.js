const ANONYMOUS = "ANONYMOUS";
const PLAIN = "PLAIN";

export default function createOnAuthenticate(credentials, userAgent) {
  return async function onAuthenticate(authenticate, mechanisms, fast, entity) {
    if (typeof credentials === "function") {
      await credentials(authenticate, mechanisms, fast);
      return;
    }

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
