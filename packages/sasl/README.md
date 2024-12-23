# SASL

SASL Negotiation for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

## Usage

### object

```js
import { xmpp } from "@xmpp/client";

const client = xmpp({
  credentials: {
    username: "foo",
    password: "bar",
  },
});
```

### function

Instead, you can provide a function that will be called every time authentication occurs (every (re)connect).

Uses cases:

- Have the user enter the password every time
- Do not ask for password before connection is made
- Debug authentication
- Using a SASL mechanism with specific requirements
- Fetch credentials from a secure database

```js
import { xmpp } from "@xmpp/client";

const client = xmpp({ credentials: onAuthenticate });

async function onAuthenticate(authenticate, mechanisms) {
  console.debug("authenticate", mechanisms);
  const credentials = {
    username: await prompt("enter username"),
    password: await prompt("enter password"),
  };
  console.debug("authenticating");
  await authenticate(credentials, mechanisms[0]);
  console.debug("authenticated");
}
```

## References

[RFC 6120 SASL Negotiation](https://xmpp.org/rfcs/rfc6120.html#sasl)
