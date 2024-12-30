# fast

fast for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

## Usage

Resource is optional and will be chosen by the server if omitted.

### string

```js
import { xmpp } from "@xmpp/client";

const client = xmpp({ resource: "laptop" });
```

### function

Instead, you can provide a function that will be called every time resource binding occurs (every (re)connect).

```js
import { xmpp } from "@xmpp/client";

const client = xmpp({ resource: onBind });

async function onBind(bind) {
  const resource = await fetchResource();
  return resource;
}
```

## References

[XEP-0484: Fast Authentication Streamlining Tokens](https://xmpp.org/extensions/xep-0484.html)
