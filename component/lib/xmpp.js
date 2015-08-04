'use strict';

module.exports.core = require('../../core')
// module.exports.core = require(process.env.NODE_XMPP_ENV === 'development' ? '../../core' : 'node-xmpp-core')
try {
    module.exports.client = require('../../client')
// module.exports.client = require(process.env.NODE_XMPP_ENV === 'development' ? '../../client' : 'node-xmpp-client')
} catch (e) {}
