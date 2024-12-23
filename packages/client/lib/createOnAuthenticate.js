const ANONYMOUS = "ANONYMOUS";

export default function createOnAuthenticate(credentials, userAgent) {
  return async function onAuthenticate(authenticate, mechanisms) {
    if (typeof credentials === "function") {
      await credentials(authenticate, mechanisms);
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

    await authenticate(credentials, mechanisms[0], userAgent);
  };
}
