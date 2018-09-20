# bind

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

You can provide a function that returns a promise so that every time the entity (re) connects you can pick a resource and/or debug resource binding.

```js
const {xmpp} = require('@xmpp/client')
const client = xmpp({resource: chooseResource})
async function chooseResource(bind) {
  console.debug('bind')
  const value = await prompt('please choose a resource')
  console.debug('binding')
  try {
    const {resource} = await bind(value)
    console.debug('bound', resource)
  } catch (err) {
    console.error(err)
  }
}
```

## References

[RFC 6120 Resource Binding](https://xmpp.org/rfcs/rfc6120.html#bind)
