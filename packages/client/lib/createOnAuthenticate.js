const ANONYMOUS = "ANONYMOUS";

export default function createOnAuthenticate(credentials, userAgent) {
  return async function onAuthenticate(authenticate, mechanisms, fast) {
    if (typeof credentials === "function") {
      await credentials(authenticate, mechanisms, fast);
      return;
    }

    if (
      !credentials?.username &&
      !credentials?.password &&
      mechanisms.includes(ANONYMOUS)
    ) {
      await authenticate(credentials, ANONYMOUS, userAgent);
      return;
    }

    if (fast?.token) {
      credentials.password = fast.token;
    }

    await authenticate(credentials, mechanisms[0], userAgent);
  };
}
