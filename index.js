'use strict';

var extend = require('util')._extend

extend(exports, require('node-xmpp-core'))
extend(exports,  require('node-xmpp-server'))
exports.Client = require('node-xmpp-client')
exports.Component = require('node-xmpp-component')
