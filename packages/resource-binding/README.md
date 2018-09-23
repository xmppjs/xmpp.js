# resource-binding

Resource binding for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

## Usage

Resource is optional and will be chosen by the server if omitted.

### string

```js
const {xmpp} = require('@xmpp/client')
const client = xmpp({resource: 'laptop'})
```

### function

Instead, you can provide a function that will be called every time resource binding occurs (every (re)connect).

Uses cases:

- Have the user choose a resource every time
- Do not ask for resource before connection is made
- Debug resource binding
- Perform an asynchronous operation to get the resource

```js
const {xmpp} = require('@xmpp/client')
const client = xmpp({resource: bindResource})

async function bindResource(bind) {
  console.debug('bind')
  const value = await prompt('enter resource')
  console.debug('binding')
  try {
    const {resource} = await bind(value)
    console.debug('bound', resource)
  } catch (err) {
    console.error(err)
    throw err
  }
}
```

## References

[RFC 6120 Resource Binding](https://xmpp.org/rfcs/rfc6120.html#bind)
