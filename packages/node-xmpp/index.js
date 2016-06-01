'use strict'

var core = require('node-xmpp-core')
var client = require('node-xmpp-client')
var server = require('node-xmpp-server')
var component = require('node-xmpp-component')

exports.Client = client
exports.Component = component
exports.server = server

core.exportCoreUtils(exports)
