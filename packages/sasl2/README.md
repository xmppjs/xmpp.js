# SASL2

SASL2 Negotiation for `@xmpp/client`.

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
import { xmpp, xml } from "@xmpp/client";

const client = xmpp({
  credentials: authenticate,
});

async function onAuthenticate(authenticate, mechanisms) {
  console.debug("authenticate", mechanisms);
  const credentials = {
    username: await prompt("enter username"),
    password: await prompt("enter password"),
  };
  console.debug("authenticating");

  // userAgent is optional
  const userAgent = await getUserAgent();

  await authenticate(credentials, mechanisms[0], userAgent);
  console.debug("authenticated");
}

async function getUserAgent() {
  let id = localStorage.get("user-agent-id");
  if (!id) {
    id = await crypto.randomUUID();
    localStorage.set("user-agent-id", id);
  }
  // https://xmpp.org/extensions/xep-0388.html#initiation
  return xml("user-agent", { id }, [
    xml("software", {}, "xmpp.js"),
    xml("device", {}, "Sonny's laptop"),
  ]);
}
```

## References

- [XEP-0388: Extensible SASL Profile](https://xmpp.org/extensions/xep-0388.html)
