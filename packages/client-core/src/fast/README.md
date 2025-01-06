# fast

fast for `@xmpp/client`. Included and enabled in `@xmpp/client`.

By default `@xmpp/fast` stores the token in memory and as such fast authentication will only be available starting with the first reconnect.

You can supply your own functions to store and retrieve the token from a persistent database.

If fast authentication fails, regular authentication with `credentials` will happen.

## Usage

```js
import { xmpp } from "@xmpp/client";

const client = xmpp({
  ...
});

client.fast.fetchToken = async () => {
  const value = await secureStorage.get("token")
  return JSON.parse(value);
}

client.fast.saveToken = async (token) => {
  await secureStorage.set("token", JSON.stringify(token));
}

// Debugging only
client.fast.on("error", (error) => {
  console.log("fast error", error);
})
```

## References

[XEP-0484: Fast Authentication Streamlining Tokens](https://xmpp.org/extensions/xep-0484.html)
