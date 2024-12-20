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

```
make test
```

If you want to iterate faster, you can watch a test file with `npx jest --watch packages/debug/test.js`.

See [Jest CLI](https://jestjs.io/docs/cli).

## Submitting

When submitting a pull request, additional tests will be run on GitHub actions.
In most cases it shouldn't be necessary but if they fail, you can run them locally after installing prosody >= 0.12 with

```
make ci
```

Good luck and feel free to ask for help in https://github.com/xmppjs/xmpp.js/discussions

# Maintenance

## Release a new version

```sh
cd xmpp.js
npx lerna publish
```
