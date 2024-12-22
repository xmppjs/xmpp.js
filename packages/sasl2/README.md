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
    clientId: "Some UUID for this client/server pair (optional)",
    software: "Name of this software (optional)",
    device: "Description of this device (optional)",
  },
});
```

### function

Instead, you can provide a function that will be called every time authentication occurs (every (re)connect).

Uses cases:

- Have the user enter the password every time
- Do not ask for password before connection is made
- Debug authentication
- Using a SASL mechanism with specific requirements (such as FAST)
- Perform an asynchronous operation to get credentials

```js
import { xmpp } from "@xmpp/client";

const client = xmpp({
  credentials: authenticate,
  clientId: "Some UUID for this client/server pair (optional)",
  software: "Name of this software (optional)",
  device: "Description of this device (optional)",
});

async function authenticate(callback, mechanisms) {
  const fast = mechanisms.find((mech) => mech.canFast)?.name;
  const mech = mechanisms.find((mech) => mech.canOther)?.name;

  return callback(
    {
      username: await prompt("enter username"),
      password: await prompt("enter password"),
      requestToken: fast,
    },
    mech,
  );
}
```

## References

- [XEP-0388: Extensible SASL Profile](https://xmpp.org/extensions/xep-0388.html)
