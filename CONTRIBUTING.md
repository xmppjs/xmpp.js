# Contributing guide

## Thank you

Firstly, thanks for thinking about contributing to `node-xmpp`!

Here's some guidelines that will help you get your pull requests merged more quickly/easily.

__Note:__ If there's a feature you'd like, there's a bug you'd like to fix, or you'd just like to get involved please raise an issue and start a conversation. We'll help as much as we can so you can get contributing - although we may not always get back right away :)

## Getting started

```
git@github.com:node-xmpp/node-xmpp.git
cd node-xmpp
npm install
npm test
```

## Coding standards

Our coding standards are covered by [JavaScript Standard Style](http://standardjs.com/). You can also test
any changes with `npm test` (this will also run the tests).

## Tests

All code (unless very trivial, or documentation) should be accompanied by tests. If you are unsure about testing please make a pull request and we'll try and help you get some tests in place for your code.

Tests are run using `npm test` and should all pass before you make a pull request.

If you pull request relates to an issue, please name your test after the issue number (e.g. 'issue #58') so we can track it if there is a regression.
