# Changelog

* 0.10.8
  * Allow user to send a plain text stanza via send() method (#200)
* 0.10.7
  * Expose used `C2SStream` class in `C2SServer` for possible overwrite (#194)
* 0.10.6
  * Exposed `C2SStream` on the main `node-xmpp` require (#193)
  * Split `C2SStream` and `C2SServer` into their own files (#193)
* 0.10.5
  * Adds a fallback for failing `node_stringprep` calls, works as if `node-stringprep` wasn't installed (#93)
* 0.10.4
  * Patch for failing browserify post-install task. Now moved to `grunt browserify` (#188)
* 0.10.2
  * Patch for CI server (travis) to install grunt-cli when running tests
* 0.10.1
  * All tests now passing our code formatting tests, so switching default `npm test` to use `grunt test` which also checks code style
