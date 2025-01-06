# Development

## Setup

npm >= 7 is required for development - update with `npm install -g npm`

```sh
git clone git@github.com:xmppjs/xmpp.js.git # Replace with your fork
cd xmpp.js
make
```

We have a pre-commit hook that will automatically format changed files.
We have a pre-push hook that will automatically run tests.
If you want to disable either for some reason, pass `--no-verify` to `git push` or `git commit`.

## Making changes

At that point you can make changes to the xmpp.js code and run tests with

```sh
make test
```

If you want to iterate faster, you can watch a test file with `npx jest --watch packages/debug/test.js`.

See [Jest CLI](https://jestjs.io/docs/cli).

## Submitting

When submitting a pull request, additional tests will be run on GitHub actions.
In most cases it shouldn't be necessary but if they fail, you can run them locally after installing prosody >= 0.12 with

```sh
make ci
```

Good luck and feel free to ask for help in https://github.com/xmppjs/xmpp.js/discussions

## Design philosophy

xmpp.js is a high level XMPP library. Learning about XMPP is required to use it. While it provides helpers for complex mechanisms such as authentication or transports, it doesn't attempt to abstract XMPP or XML.

As such, simple XMPP semantics shouldn't be replaced with JavaScript APIs when a simple XML element can express them.

## Maintenance

## Release a new version

```sh
cd xmpp.js
npx lerna publish
```
