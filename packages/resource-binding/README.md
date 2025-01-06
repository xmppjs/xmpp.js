# resource-binding

Resource binding for `@xmpp/client`.

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

[RFC 6120 Resource Binding](https://xmpp.org/rfcs/rfc6120.html#bind)
