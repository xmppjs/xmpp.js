const ANONYMOUS = "ANONYMOUS";

export default function createOnAuthenticate(credentials) {
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
      await authenticate(credentials, ANONYMOUS);
      return;
    }

    await authenticate(credentials, mechanisms[0]);
  };
}
