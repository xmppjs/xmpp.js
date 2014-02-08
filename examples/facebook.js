'use strict';

/**
 * Login to facebook chat via XMPP and send a simple 'hello world' message
 * to another user
 *
 * To look up a facebook user ID use: http://findmyfacebookid.com/
 *
 * Ensure that you obtain an access token with the extended 'xmpp_login'
 * permission or login will fail.
 *
 * To obtain one of these visit: https://developers.facebook.com/tools/explorer
 * Select to generate an access token
 * Click 'extended permissions'
 * Choose 'xmpp_login'
 * Generate your access token
 */
var Client = require('../index')
  , ltx  = require('ltx')

var facebookId = '<< facebook user ID >>'
var appId = '<< appliction ID >> '
var appSecret = '<< application secret >>'
var accessToken = '<< access token >>'

var otherUserId = '<< send message to ID >>'

/* jshint -W106 */
var client = new Client({
    jid: '-' + facebookId + '@chat.facebook.com',
    api_key: appId,
    secret_key: appSecret,
    access_token: accessToken
})

client.addListener('online', function(data) {
    console.log('Connected as ' + data.jid.user + '@' + data.jid.domain + '/' + data.jid.resource)
    var chat = new ltx.Element('message', { to: '-' + otherUserId + '@chat.facebook.com' })
        .c('body')
        .t('Hello world')
    client.send(chat)
    // nodejs has nothing left to do and will exit
    client.end()
})

client.on('stanza', function(stanza) {
    console.log('Received:', stanza.toString())
})

client.addListener('error', function(e) {
    console.error(e)
    process.exit(1)
})
